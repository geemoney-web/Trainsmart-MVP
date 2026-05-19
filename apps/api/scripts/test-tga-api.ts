import { TgaApiClient } from '../src/tga/tga-api.client';

async function main() {
  const client = new TgaApiClient();

  console.log('Testing qualification search...');
  const quals = await client.searchQualifications('BSB50120');
  console.log('Search results count:', quals.length);

  console.log('\nTesting qualification detail...');
  const qual = await client.getQualificationDetail('BSB50120');
  console.log('Qual code:', qual?.code);
  console.log('Qual title:', qual?.title);
  console.log('Qual status:', qual?.status);
  console.log(
    'Unit count:',
    qual?.unitGroups?.flatMap((g: any) => g.units).length ?? 0,
  );

  const firstUnitCode = qual?.unitGroups?.[0]?.units?.[0]?.code;
  if (firstUnitCode) {
    console.log('\nTesting unit detail for:', firstUnitCode);
    const unit = await client.getUnitDetail(firstUnitCode);
    console.log('Unit code:', unit?.code);
    console.log('Element count:', unit?.elements?.length ?? 0);
    console.log(
      'First element PCs:',
      unit?.elements?.[0]?.performanceCriteria?.length ?? 0,
    );
  }
}

main().catch(console.error);
