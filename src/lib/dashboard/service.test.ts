type Chainable = {
  then: (resolve: (value: unknown) => void, reject: (reason: unknown) => void) => Promise<unknown>;
} & Record<string, jest.Mock>;

function createChainable(result: unknown): Chainable {
  const chain = {
    then: (resolve: (value: unknown) => void, reject: (reason: unknown) => void) =>
      Promise.resolve(result).then(resolve, reject),
  } as Chainable;

  for (const method of ["from", "where", "groupBy", "orderBy", "limit", "innerJoin"]) {
    chain[method] = jest.fn(() => chain);
  }

  return chain;
}

const mockDb = {
  select: jest.fn(),
};

jest.mock("@/db", () => ({ db: mockDb }));

import {
  getEquipmentStatistics,
  getMaintenanceStatistics,
  getRecentActivity,
} from "./service";

describe("getEquipmentStatistics", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("zero-fills statuses with no rows and sums the total", async () => {
    // Arrange
    mockDb.select.mockReturnValue(
      createChainable([
        { status: "operational", count: 3 },
        { status: "retired", count: 1 },
      ]),
    );

    // Act
    const result = await getEquipmentStatistics();

    // Assert
    expect(result).toEqual({
      total: 4,
      byStatus: {
        operational: 3,
        under_maintenance: 0,
        out_of_service: 0,
        retired: 1,
      },
    });
  });
});

describe("getMaintenanceStatistics", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("combines status and type counts with zero-filled defaults", async () => {
    // Arrange
    mockDb.select
      .mockReturnValueOnce(createChainable([{ status: "scheduled", count: 2 }]))
      .mockReturnValueOnce(createChainable([{ type: "preventive", count: 2 }]));

    // Act
    const result = await getMaintenanceStatistics();

    // Assert
    expect(result).toEqual({
      total: 2,
      byStatus: { scheduled: 2, in_progress: 0, completed: 0, cancelled: 0 },
      byType: { preventive: 2, corrective: 0, inspection: 0 },
    });
  });
});

describe("getRecentActivity", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("returns the joined rows provided by the database", async () => {
    // Arrange
    const rows = [
      {
        id: "maint-1",
        equipmentId: "equip-1",
        equipmentName: "Air Compressor",
        type: "preventive",
        status: "scheduled",
        updatedAt: new Date("2024-06-02"),
      },
    ];
    mockDb.select.mockReturnValue(createChainable(rows));

    // Act
    const result = await getRecentActivity(5);

    // Assert
    expect(result).toEqual(rows);
  });
});
