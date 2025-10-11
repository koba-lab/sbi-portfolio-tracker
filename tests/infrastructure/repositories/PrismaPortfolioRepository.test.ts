import { assertEquals, assertExists } from "jsr:@std/assert@1";
import { beforeEach, describe, it } from "jsr:@std/testing@1/bdd";
import PrismaClientPackage from "npm:@prisma/client@6.16.3";
const { PrismaClient } = PrismaClientPackage;
type PrismaClientType = InstanceType<typeof PrismaClient>;
import { PrismaPortfolioRepository } from "@/infrastructure/repositories/PrismaPortfolioRepository.ts";
import { Portfolio } from "@/domain/entities/Portfolio.ts";
import { Stock } from "@/domain/entities/Stock.ts";

describe("PrismaPortfolioRepository", () => {
  let prisma: PrismaClientType;
  let repository: PrismaPortfolioRepository;

  beforeEach(async () => {
    prisma = new PrismaClient();
    repository = new PrismaPortfolioRepository(prisma);

    // Clean up test data
    await prisma.portfolio_snapshots.deleteMany();
  });

  describe("save", () => {
    it("should save a portfolio with holdings", async () => {
      const stock = new Stock(
        "7203",
        "トヨタ自動車",
        100,
        2000,
        2500,
        "東証プライム",
        2.5,
      );
      const portfolio = new Portfolio(
        [stock],
        new Date("2025-01-11"),
      );

      await repository.save(portfolio);

      const snapshots = await prisma.portfolio_snapshots.findMany({
        where: { snapshot_date: new Date("2025-01-11") },
      });

      assertEquals(snapshots.length, 1);
      assertEquals(snapshots[0].ticker_code, "7203");
      assertEquals(snapshots[0].name, "トヨタ自動車");
      assertEquals(snapshots[0].asset_type, "stock");
    });
  });

  describe("findLatest", () => {
    it("should return the latest portfolio", async () => {
      // Insert test data with different dates
      await prisma.portfolio_snapshots.create({
        data: {
          ticker_code: "7203",
          name: "トヨタ自動車",
          asset_type: "stock",
          quantity: 100,
          acquisition_price: 2000,
          current_price: 2500,
          market_value: 250000,
          profit_loss: 50000,
          profit_loss_rate: 25,
          snapshot_date: new Date("2025-01-10"),
        },
      });
      await prisma.portfolio_snapshots.create({
        data: {
          ticker_code: "7203",
          name: "トヨタ自動車",
          asset_type: "stock",
          quantity: 100,
          acquisition_price: 2000,
          current_price: 2600,
          market_value: 260000,
          profit_loss: 60000,
          profit_loss_rate: 30,
          snapshot_date: new Date("2025-01-11"),
        },
      });

      const portfolio = await repository.findLatest();

      assertExists(portfolio);
      assertEquals(portfolio.snapshotDate.toISOString().split("T")[0], "2025-01-11");
      assertEquals(portfolio.holdings.length, 1);
    });

    it("should return null when no portfolio exists", async () => {
      const portfolio = await repository.findLatest();
      assertEquals(portfolio, null);
    });
  });

  describe("findByDate", () => {
    it("should return portfolio for specific date", async () => {
      await prisma.portfolio_snapshots.create({
        data: {
          ticker_code: "7203",
          name: "トヨタ自動車",
          asset_type: "stock",
          quantity: 100,
          acquisition_price: 2000,
          current_price: 2500,
          market_value: 250000,
          profit_loss: 50000,
          profit_loss_rate: 25,
          snapshot_date: new Date("2025-01-11"),
        },
      });

      const portfolio = await repository.findByDate(new Date("2025-01-11"));

      assertExists(portfolio);
      assertEquals(portfolio.snapshotDate.toISOString().split("T")[0], "2025-01-11");
      assertEquals(portfolio.holdings.length, 1);
    });

    it("should return null when no portfolio exists for date", async () => {
      const portfolio = await repository.findByDate(new Date("2025-01-11"));
      assertEquals(portfolio, null);
    });
  });

  describe("findByDateRange", () => {
    it("should return portfolios within date range", async () => {
      await prisma.portfolio_snapshots.create({
        data: {
          ticker_code: "7203",
          name: "トヨタ自動車",
          asset_type: "stock",
          quantity: 100,
          acquisition_price: 2000,
          current_price: 2500,
          market_value: 250000,
          profit_loss: 50000,
          profit_loss_rate: 25,
          snapshot_date: new Date("2025-01-10"),
        },
      });
      await prisma.portfolio_snapshots.create({
        data: {
          ticker_code: "7203",
          name: "トヨタ自動車",
          asset_type: "stock",
          quantity: 100,
          acquisition_price: 2000,
          current_price: 2600,
          market_value: 260000,
          profit_loss: 60000,
          profit_loss_rate: 30,
          snapshot_date: new Date("2025-01-11"),
        },
      });

      const portfolios = await repository.findByDateRange(
        new Date("2025-01-10"),
        new Date("2025-01-11"),
      );

      assertEquals(portfolios.length, 2);
    });

    it("should return empty array when no portfolios in range", async () => {
      const portfolios = await repository.findByDateRange(
        new Date("2025-01-10"),
        new Date("2025-01-11"),
      );
      assertEquals(portfolios.length, 0);
    });
  });
});
