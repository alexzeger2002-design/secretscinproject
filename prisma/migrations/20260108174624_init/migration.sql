-- CreateTable
CREATE TABLE "Visit" (
    "id" SERIAL NOT NULL,
    "ip" TEXT NOT NULL,
    "country" TEXT,
    "browserFingerprint" TEXT NOT NULL,
    "userAgent" TEXT NOT NULL,
    "referrer" TEXT,
    "utmTags" JSONB,
    "isSuspicious" BOOLEAN NOT NULL DEFAULT false,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Visit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Visit_browserFingerprint_idx" ON "Visit"("browserFingerprint");

-- CreateIndex
CREATE INDEX "Visit_timestamp_idx" ON "Visit"("timestamp");

-- CreateIndex
CREATE INDEX "Visit_country_idx" ON "Visit"("country");
