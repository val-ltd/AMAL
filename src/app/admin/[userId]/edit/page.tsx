
import { getUser, getDepartments } from '@/lib/data';
import { EditUserForm } from '@/components/admin/edit-user-form';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { notFound } from 'next/navigation';

interface EditUserPageProps {
  params: {
    userId: string;
  };
}

export default async function EditUserPage({ params }: EditUserPageProps) {
  const { userId } = params;
  const [user, departments] = await Promise.all([
      getUser(userId),
      getDepartments()
  ]);

  if (!user) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Ubah Pengguna</CardTitle>
          <CardDescription>
            Perbarui detail untuk pengguna {user.name}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EditUserForm user={user} departments={departments} />
        </CardContent>
      </Card>
    </div>
  );
}
