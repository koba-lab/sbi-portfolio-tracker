import type { PrismaClient } from "npm:@prisma/client@6.16.3";
import { Portfolio } from "@/domain/entities/Portfolio.ts";
import type { PortfolioRepository } from "@/domain/repositories/PortfolioRepository.ts";
import type { Holding } from "@/domain/entities/Holding.ts";
import { Stock } from "@/domain/entities/Stock.ts";
import { MutualFund } from "@/domain/entities/MutualFund.ts";
import { ForeignStock } from "@/domain/entities/ForeignStock.ts";

export class PrismaPortfolioRepository implements PortfolioRepository {
  constructor(private prisma: PrismaClient) {}

  async save(portfolio: Portfolio): Promise<void> {
    const records = portfolio.holdings.map((holding) => ({
      ticker_code: holding.tickerCode,
      name: holding.name,
      asset_type: holding.getAssetType(),
      quantity: holding.quantity,
      acquisition_price: holding.acquisitionPrice,
      current_price: holding.currentPrice,
      market_value: holding.getMarketValue(),
      profit_loss: holding.getProfitLoss(),
      profit_loss_rate: holding.getProfitLossRate(),
      additional_info: this.serializeAdditionalInfo(holding),
      snapshot_date: portfolio.snapshotDate,
    }));

    await this.prisma.portfolio_snapshots.createMany({
      data: records,
    });
  }

  async findLatest(): Promise<Portfolio | null> {
    const latestDate = await this.prisma.portfolio_snapshots.findFirst({
      orderBy: { snapshot_date: "desc" },
      select: { snapshot_date: true },
    });

    if (!latestDate) return null;

    const records = await this.prisma.portfolio_snapshots.findMany({
      where: { snapshot_date: latestDate.snapshot_date },
    });

    return this.mapToPortfolio(records, latestDate.snapshot_date);
  }

  async findByDate(date: Date): Promise<Portfolio | null> {
    const records = await this.prisma.portfolio_snapshots.findMany({
      where: { snapshot_date: date },
    });

    if (records.length === 0) return null;

    return this.mapToPortfolio(records, date);
  }

  async findByDateRange(
    startDate: Date,
    endDate: Date,
  ): Promise<Portfolio[]> {
    const records = await this.prisma.portfolio_snapshots.findMany({
      where: {
        snapshot_date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { snapshot_date: "asc" },
    });

    // Group by snapshot_date
    const groupedRecords = new Map<string, typeof records>();
    for (const record of records) {
      const dateKey = record.snapshot_date.toISOString();
      if (!groupedRecords.has(dateKey)) {
        groupedRecords.set(dateKey, []);
      }
      groupedRecords.get(dateKey)!.push(record);
    }

    const portfolios: Portfolio[] = [];
    for (const [_dateKey, dateRecords] of groupedRecords) {
      const portfolio = this.mapToPortfolio(
        dateRecords,
        dateRecords[0].snapshot_date,
      );
      portfolios.push(portfolio);
    }

    return portfolios;
  }

  private serializeAdditionalInfo(holding: Holding): object {
    if (holding instanceof Stock) {
      return { market: holding.market, dividendYield: holding.dividendYield };
    }
    if (holding instanceof ForeignStock) {
      return {
        country: holding.country,
        currency: holding.currency,
        exchangeRate: holding.exchangeRate,
        localPrice: holding.localPrice,
      };
    }
    if (holding instanceof MutualFund) {
      return {
        category: holding.category,
        trustFee: holding.trustFee,
        isNISA: holding.isNISA,
      };
    }
    return {};
  }

  private mapToPortfolio(
    records: Array<{
      ticker_code: string;
      name: string;
      asset_type: string;
      quantity: number | { toNumber(): number };
      acquisition_price: number | { toNumber(): number };
      current_price: number | { toNumber(): number };
      additional_info: unknown;
    }>,
    snapshotDate: Date,
  ): Portfolio {
    const holdings = records.map((record) => {
      const additionalInfo = record.additional_info as {
        market?: string;
        dividendYield?: number;
        country?: string;
        currency?: string;
        exchangeRate?: number;
        localPrice?: number;
        category?: string;
        trustFee?: number;
        isNISA?: boolean;
      } | null;

      const quantity = typeof record.quantity === "number"
        ? record.quantity
        : record.quantity.toNumber();
      const acquisitionPrice = typeof record.acquisition_price === "number"
        ? record.acquisition_price
        : record.acquisition_price.toNumber();
      const currentPrice = typeof record.current_price === "number"
        ? record.current_price
        : record.current_price.toNumber();
      switch (record.asset_type) {
        case "stock":
          return new Stock(
            record.ticker_code,
            record.name,
            quantity,
            acquisitionPrice,
            currentPrice,
            additionalInfo?.market,
            additionalInfo?.dividendYield,
          );
        case "foreign_stock":
          return new ForeignStock(
            record.ticker_code,
            record.name,
            quantity,
            acquisitionPrice,
            currentPrice,
            additionalInfo?.country!,
            additionalInfo?.currency!,
            additionalInfo?.exchangeRate!,
            additionalInfo?.localPrice,
          );
        case "mutual_fund":
          return new MutualFund(
            record.ticker_code,
            record.name,
            quantity,
            acquisitionPrice,
            currentPrice,
            additionalInfo?.category,
            additionalInfo?.trustFee,
            additionalInfo?.isNISA,
          );
        default:
          throw new Error(`Unknown asset type: ${record.asset_type}`);
      }
    });

    return new Portfolio(holdings, snapshotDate);
  }
}
