import { PrismaClient } from '@prisma/client';
import { createLogger } from '../src/lib/logger';

const logDb = createLogger('[db]');

const prisma = new PrismaClient();

const ROLES = [
  {
    key: 'super_admin',
    nameFa: 'مدیر کل سیستم',
    description: 'دسترسی کامل',
    permissions: ['all'],
    sortOrder: 0,
  },
  {
    key: 'sales',
    nameFa: 'کارشناس فروش',
    description: 'فروش و CRM',
    permissions: ['sales_view', 'sales_edit', 'crm_view'],
    sortOrder: 1,
  },
  {
    key: 'production_manager',
    nameFa: 'مدیر تولید',
    description: 'تولید و سفارشات',
    permissions: ['production_view', 'orders_view'],
    sortOrder: 2,
  },
  {
    key: 'designer',
    nameFa: 'طراح داخلی',
    description: 'طراحی و پروژه',
    permissions: ['projects_view'],
    sortOrder: 3,
  },
  {
    key: 'finance_manager',
    nameFa: 'مدیر مالی',
    description: 'مالی و گزارش',
    permissions: ['finance_all', 'reports_view'],
    sortOrder: 4,
  },
] as const;

async function main() {
  for (const role of ROLES) {
    await prisma.systemRole.upsert({
      where: { key: role.key },
      create: {
        key: role.key,
        nameFa: role.nameFa,
        description: role.description,
        permissions: role.permissions,
        sortOrder: role.sortOrder,
        isSystem: true,
      },
      update: {
        nameFa: role.nameFa,
        description: role.description,
        permissions: role.permissions,
        sortOrder: role.sortOrder,
      },
    });
  }

  const superAdminRole = await prisma.systemRole.findUniqueOrThrow({
    where: { key: 'super_admin' },
  });

  await prisma.user.upsert({
    where: { mobile: '9126723365' },
    create: {
      mobile: '9126723365',
      mobileE164: '989126723365',
      displayName: 'مدیر کل',
      systemRoleId: superAdminRole.id,
      isBootstrap: true,
      status: 'active',
    },
    update: {
      displayName: 'مدیر کل',
      systemRoleId: superAdminRole.id,
      isBootstrap: true,
      status: 'active',
    },
  });

  const roleCount = await prisma.systemRole.count();
  const userCount = await prisma.user.count();
  logDb.info(`seed: roles=${roleCount} users=${userCount}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
