import { NewRequestForm } from '@/components/new-request-form';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function NewRequestPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Create Budget Request</CardTitle>
          <CardDescription>
            Fill out the form below to submit a new budget request for approval.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NewRequestForm />
        </CardContent>
      </Card>
    </div>
  );
}
