-- AlterTable
ALTER TABLE "User" ADD COLUMN     "address" TEXT DEFAULT '',
ADD COLUMN     "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "pushNotifications" BOOLEAN NOT NULL DEFAULT true;
