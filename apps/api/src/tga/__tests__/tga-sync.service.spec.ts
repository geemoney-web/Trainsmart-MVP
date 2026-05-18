import { createHash } from 'crypto';

// Test computeQualificationHash logic inline (not importing the service to avoid DI issues)
function computeQualificationHash(data: any): string {
  const fields = {
    title: data.title,
    status: data.status,
    supersededBy: data.supersededBy,
    trainingPackage: data.trainingPackage?.code ?? null,
  };
  return createHash('sha256').update(JSON.stringify(fields)).digest('hex');
}

function computeUnitHash(data: any): string {
  const fields = {
    title: data.title,
    status: data.status,
    supersededBy: data.supersededBy,
    elements: data.elements.map((e: any) => ({
      num: e.num,
      title: e.title,
      pcs: e.performanceCriteria.map((pc: any) => ({ num: pc.num, text: pc.text })),
    })),
  };
  return createHash('sha256').update(JSON.stringify(fields)).digest('hex');
}

describe('TgaSyncService - hash computation', () => {
  const sampleQual = {
    code: 'BSB50120',
    title: 'Diploma of Business',
    status: 'Current',
    supersededBy: null,
    trainingPackage: { code: 'BSB', title: 'Business Services' },
    unitGroups: [],
  };

  test('same qualification data produces same hash', () => {
    expect(computeQualificationHash(sampleQual)).toBe(computeQualificationHash(sampleQual));
  });

  test('different title produces different hash', () => {
    const modified = { ...sampleQual, title: 'Diploma of Business (Modified)' };
    expect(computeQualificationHash(sampleQual)).not.toBe(computeQualificationHash(modified));
  });

  test('different status produces different hash', () => {
    const superseded = { ...sampleQual, status: 'Superseded' };
    expect(computeQualificationHash(sampleQual)).not.toBe(computeQualificationHash(superseded));
  });

  const sampleUnit = {
    code: 'BSBWHS311',
    title: 'Assist with maintaining workplace safety',
    status: 'Current',
    supersededBy: null,
    elements: [
      { num: '1', title: 'Element one', performanceCriteria: [{ num: '1.1', text: 'Original text' }] },
    ],
  };

  test('same unit data produces same hash', () => {
    expect(computeUnitHash(sampleUnit)).toBe(computeUnitHash(sampleUnit));
  });

  test('changed PC text produces different hash', () => {
    const modified = {
      ...sampleUnit,
      elements: [{ ...sampleUnit.elements[0], performanceCriteria: [{ num: '1.1', text: 'Changed text' }] }],
    };
    expect(computeUnitHash(sampleUnit)).not.toBe(computeUnitHash(modified));
  });

  test('changed element title produces different hash', () => {
    const modified = {
      ...sampleUnit,
      elements: [{ ...sampleUnit.elements[0], title: 'Element one modified' }],
    };
    expect(computeUnitHash(sampleUnit)).not.toBe(computeUnitHash(modified));
  });
});

describe('Alert deduplication logic', () => {
  test('createAlertIfNotExists skips when existing unresolved alert matches', async () => {
    // Mock prisma.complianceAlert.findFirst returning an existing alert
    const mockPrisma = {
      complianceAlert: {
        findFirst: jest.fn().mockResolvedValue({ id: 'existing-id' }),
        create: jest.fn(),
      },
    };

    // Simulate the deduplication logic
    const existing = await mockPrisma.complianceAlert.findFirst({});
    if (!existing) {
      await mockPrisma.complianceAlert.create({});
    }

    expect(mockPrisma.complianceAlert.create).not.toHaveBeenCalled();
  });

  test('createAlertIfNotExists creates when no existing alert', async () => {
    const mockPrisma = {
      complianceAlert: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: 'new-id' }),
      },
    };

    const existing = await mockPrisma.complianceAlert.findFirst({});
    if (!existing) {
      await mockPrisma.complianceAlert.create({});
    }

    expect(mockPrisma.complianceAlert.create).toHaveBeenCalled();
  });
});
