import { MigrationInterface, QueryRunner } from "typeorm";

export class InitSchema1787109333640 implements MigrationInterface {
    name = 'InitSchema1787109333640'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "user" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "phone" character varying NOT NULL, "email" character varying NOT NULL, "fullName" character varying NOT NULL, "passwordHash" character varying NOT NULL, "role" character varying NOT NULL DEFAULT 'volunteer', "organization" character varying, "position" character varying, "avatarUrl" character varying, "resetPasswordTokenHash" character varying, "resetPasswordExpiresAt" TIMESTAMP WITH TIME ZONE, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_8e1f623798118e629b46a9e6299" UNIQUE ("phone"), CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "patient" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "code" character varying NOT NULL, "fullName" character varying NOT NULL, "age" integer NOT NULL, "sex" character varying NOT NULL, "phone" character varying, "address" character varying, "treatmentRight" character varying, "smoker" boolean NOT NULL DEFAULT false, "heightCm" double precision, "joinDate" date NOT NULL, "volunteerId" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_362551a5f4bdaa843a2eafb5474" UNIQUE ("code"), CONSTRAINT "PK_8dfa510bb29ad31ab2139fbfb99" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "health_record" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "patientId" uuid NOT NULL, "visitNumber" integer NOT NULL, "visitDate" date NOT NULL, "weightKg" double precision, "bmi" double precision, "systolicBp" integer, "diastolicBp" integer, "heartRate" integer, "waistCm" double precision, "dtxFpg" integer, "dtxCategory" character varying, "cvdScore" double precision, "cvdRiskPercent" double precision, "cvdRiskLevel" character varying, "selfCareBehavior" character varying, "notes" text, "q1Depressed" boolean, "q2Anhedonia" boolean, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_e30b1cc9efc1a47635e8583b122" UNIQUE ("patientId", "visitNumber"), CONSTRAINT "PK_abe4a44118137fd49ab9edff372" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "knowledge_item" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying NOT NULL, "type" character varying NOT NULL, "videoUrl" character varying, "imageUrl" character varying, "description" text, "createdById" uuid, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_0adf76cd745cd8ebb59de287e1f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "knowledge_session" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "patientId" uuid NOT NULL, "volunteerId" uuid, "givenDate" date NOT NULL, "mediaType" character varying NOT NULL, "knowledgeItemId" uuid, "itemTitleSnapshot" character varying NOT NULL, "result" character varying NOT NULL, "note" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_69d56e53cb4e7a353ac512b90ea" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "survey_response" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "q1" integer NOT NULL, "q2" integer NOT NULL, "q3" integer NOT NULL, "q4" integer NOT NULL, "q5" integer NOT NULL, "q6" integer NOT NULL, "q7" integer NOT NULL, "q8" integer NOT NULL, "q9" integer NOT NULL, "q10" integer NOT NULL, "q11" integer NOT NULL, "q12" integer NOT NULL, "q13" integer NOT NULL, "q14" integer NOT NULL, "q15" integer NOT NULL, "q16" integer NOT NULL, "q17" integer NOT NULL, "q18" integer NOT NULL, "q19" integer NOT NULL, "q20" integer NOT NULL, "comment" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_d9326eb52bf8b23d56a39ce419a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "patient" ADD CONSTRAINT "FK_e80100159c7e50695e452212536" FOREIGN KEY ("volunteerId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "health_record" ADD CONSTRAINT "FK_0a7486e7571808c07835f1deeff" FOREIGN KEY ("patientId") REFERENCES "patient"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "knowledge_item" ADD CONSTRAINT "FK_df71692f134470c710b149c76fb" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "knowledge_session" ADD CONSTRAINT "FK_f0ea462c3d21420fc3e459eba17" FOREIGN KEY ("patientId") REFERENCES "patient"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "knowledge_session" ADD CONSTRAINT "FK_49a16430c6ec721fd19bf06aca8" FOREIGN KEY ("volunteerId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "knowledge_session" ADD CONSTRAINT "FK_5d9425611f745b729bc11f78548" FOREIGN KEY ("knowledgeItemId") REFERENCES "knowledge_item"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "survey_response" ADD CONSTRAINT "FK_6f270d46c6b0e0b68373a417c5a" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "survey_response" DROP CONSTRAINT "FK_6f270d46c6b0e0b68373a417c5a"`);
        await queryRunner.query(`ALTER TABLE "knowledge_session" DROP CONSTRAINT "FK_5d9425611f745b729bc11f78548"`);
        await queryRunner.query(`ALTER TABLE "knowledge_session" DROP CONSTRAINT "FK_49a16430c6ec721fd19bf06aca8"`);
        await queryRunner.query(`ALTER TABLE "knowledge_session" DROP CONSTRAINT "FK_f0ea462c3d21420fc3e459eba17"`);
        await queryRunner.query(`ALTER TABLE "knowledge_item" DROP CONSTRAINT "FK_df71692f134470c710b149c76fb"`);
        await queryRunner.query(`ALTER TABLE "health_record" DROP CONSTRAINT "FK_0a7486e7571808c07835f1deeff"`);
        await queryRunner.query(`ALTER TABLE "patient" DROP CONSTRAINT "FK_e80100159c7e50695e452212536"`);
        await queryRunner.query(`DROP TABLE "survey_response"`);
        await queryRunner.query(`DROP TABLE "knowledge_session"`);
        await queryRunner.query(`DROP TABLE "knowledge_item"`);
        await queryRunner.query(`DROP TABLE "health_record"`);
        await queryRunner.query(`DROP TABLE "patient"`);
        await queryRunner.query(`DROP TABLE "user"`);
    }

}
