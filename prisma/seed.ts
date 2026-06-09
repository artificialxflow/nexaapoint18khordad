import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const BOOTSTRAP_USERNAME = 'artificialxflow';
const BOOTSTRAP_PASSWORD = 'Ronak#123Ronak';
const BOOTSTRAP_DISPLAY_NAME = 'مدیر کل';

type RoleSeed = {
  slug: string;
  nameFa: string;
  level: number;
  permissions: Record<string, boolean>;
};

const ROLES: RoleSeed[] = [
  {
    slug: 'super_admin',
    nameFa: 'مدیر کل سیستم',
    level: 100,
    permissions: {
      'users:read': true,
      'users:write': true,
      'invites:read': true,
      'invites:write': true,
      'settings:all': true,
    },
  },
  {
    slug: 'admin',
    nameFa: 'مدیر',
    level: 80,
    permissions: {
      'users:read': true,
      'users:write': true,
      'invites:read': true,
      'invites:write': true,
    },
  },
  {
    slug: 'finance_manager',
    nameFa: 'مدیر مالی',
    level: 50,
    permissions: { 'users:read': true },
  },
  {
    slug: 'production_manager',
    nameFa: 'مدیر تولید',
    level: 50,
    permissions: { 'users:read': true },
  },
  {
    slug: 'sales',
    nameFa: 'فروش',
    level: 30,
    permissions: {},
  },
  {
    slug: 'designer',
    nameFa: 'طراح',
    level: 30,
    permissions: {},
  },
];

async function main() {
  console.log('[seed] Starting database seed…');

  for (const role of ROLES) {
    await prisma.systemRole.upsert({
      where: { slug: role.slug },
      create: {
        slug: role.slug,
        nameFa: role.nameFa,
        level: role.level,
        permissions: role.permissions,
        isSystem: true,
      },
      update: {
        nameFa: role.nameFa,
        level: role.level,
        permissions: role.permissions,
      },
    });
    console.log(`[seed] Role upserted: ${role.slug}`);
  }

  const superAdminRole = await prisma.systemRole.findUniqueOrThrow({
    where: { slug: 'super_admin' },
  });

  const passwordHash = await bcrypt.hash(BOOTSTRAP_PASSWORD, 12);

  await prisma.user.upsert({
    where: { username: BOOTSTRAP_USERNAME },
    create: {
      username: BOOTSTRAP_USERNAME,
      passwordHash,
      displayName: BOOTSTRAP_DISPLAY_NAME,
      status: 'active',
      systemRoleId: superAdminRole.id,
      mustChangePassword: false,
    },
    update: {
      passwordHash,
      displayName: BOOTSTRAP_DISPLAY_NAME,
      status: 'active',
      systemRoleId: superAdminRole.id,
    },
  });

  console.log(`[seed] Bootstrap user ready: ${BOOTSTRAP_USERNAME}`);
  console.log('[seed] Done.');
}

main()
  .catch((err) => {
    console.error('[seed] Failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
