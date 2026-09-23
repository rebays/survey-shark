// Registers every survey in the registry with the database so it shows up in the
// admin dashboard even before any responses have been submitted. Not required for
// data collection to work (the API route upserts on first response too) — this is
// just so the dashboard isn't empty on day one.
import { db } from "../src/lib/db";
import { surveys } from "../src/lib/db/schema";
import { SURVEY_REGISTRY } from "../src/lib/surveys/registry";

async function main() {
  for (const definition of SURVEY_REGISTRY) {
    await db
      .insert(surveys)
      .values({
        slug: definition.slug,
        title: definition.title,
        version: definition.version,
        definition,
        isActive: true,
      })
      .onConflictDoUpdate({
        target: [surveys.slug, surveys.version],
        set: { title: definition.title, definition },
      });
    console.log(`Seeded ${definition.slug}@${definition.version}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
