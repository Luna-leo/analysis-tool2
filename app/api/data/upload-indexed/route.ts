import { withAuth } from '@/utils/api/middleware';
import { POST as postHandler } from './handler';

export const POST = withAuth(postHandler);