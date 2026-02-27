-- Add new columns to BrandProfile
ALTER TABLE "BrandProfile" ADD COLUMN IF NOT EXISTS "logoUrl" TEXT NOT NULL DEFAULT '';
ALTER TABLE "BrandProfile" ADD COLUMN IF NOT EXISTS "tagline" TEXT NOT NULL DEFAULT '';
ALTER TABLE "BrandProfile" ADD COLUMN IF NOT EXISTS "valueProposition" TEXT;
ALTER TABLE "BrandProfile" ADD COLUMN IF NOT EXISTS "industry" TEXT NOT NULL DEFAULT '';
ALTER TABLE "BrandProfile" ADD COLUMN IF NOT EXISTS "geoFocus" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "BrandProfile" ADD COLUMN IF NOT EXISTS "voiceAttributes" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "BrandProfile" ADD COLUMN IF NOT EXISTS "tonePerChannel" JSONB NOT NULL DEFAULT '{}';
ALTER TABLE "BrandProfile" ADD COLUMN IF NOT EXISTS "topicPillars" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "BrandProfile" ADD COLUMN IF NOT EXISTS "targetAudiences" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "BrandProfile" ADD COLUMN IF NOT EXISTS "terminologyDos" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "BrandProfile" ADD COLUMN IF NOT EXISTS "terminologyDonts" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "BrandProfile" ADD COLUMN IF NOT EXISTS "contentRules" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "BrandProfile" ADD COLUMN IF NOT EXISTS "benefits" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "BrandProfile" ADD COLUMN IF NOT EXISTS "productFeatures" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "BrandProfile" ADD COLUMN IF NOT EXISTS "competitors" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "BrandProfile" ADD COLUMN IF NOT EXISTS "differentiators" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "BrandProfile" ADD COLUMN IF NOT EXISTS "boilerplateAbout" TEXT NOT NULL DEFAULT '';
ALTER TABLE "BrandProfile" ADD COLUMN IF NOT EXISTS "boilerplateDisclaimer" TEXT NOT NULL DEFAULT '';
ALTER TABLE "BrandProfile" ADD COLUMN IF NOT EXISTS "rawDocument" TEXT NOT NULL DEFAULT '';

-- Migrate data from old columns to new columns (if they exist)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'BrandProfile' AND column_name = 'brandTerms') THEN
    UPDATE "BrandProfile" SET "terminologyDos" = COALESCE("brandTerms", '[]'::jsonb);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'BrandProfile' AND column_name = 'forbiddenPhrases') THEN
    UPDATE "BrandProfile" SET "terminologyDonts" = COALESCE("forbiddenPhrases", '[]'::jsonb);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'BrandProfile' AND column_name = 'positioning') THEN
    UPDATE "BrandProfile" SET "valueProposition" = COALESCE("positioning", '');
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'BrandProfile' AND column_name = 'voiceTone') THEN
    UPDATE "BrandProfile" SET "voiceAttributes" = CASE
      WHEN "voiceTone" IS NOT NULL AND "voiceTone" != '' THEN jsonb_build_array("voiceTone")
      ELSE '[]'::jsonb
    END;
  END IF;
END $$;

-- Drop old columns
ALTER TABLE "BrandProfile" DROP COLUMN IF EXISTS "brandTerms";
ALTER TABLE "BrandProfile" DROP COLUMN IF EXISTS "forbiddenPhrases";
ALTER TABLE "BrandProfile" DROP COLUMN IF EXISTS "voiceTone";
ALTER TABLE "BrandProfile" DROP COLUMN IF EXISTS "positioning";

-- Drop ICP table
DROP TABLE IF EXISTS "ICP";
