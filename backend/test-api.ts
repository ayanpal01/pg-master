import dotenv from 'dotenv';
dotenv.config();
import { ExpenseService } from './src/services/expense.service';
import { connectDB } from './src/lib/db';
import mongoose from 'mongoose';

async function run() {
  await connectDB();
  const res = await ExpenseService.addExpense('65f123456789012345678901', '65f123456789012345678902', {
    amount: 100,
    description: 'Test',
    date: new Date(),
    spentBy: '65f123456789012345678903'
  });
  console.log('Result:', res);
  process.exit(0);
}
run().catch(console.error);
