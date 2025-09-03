
import { getRequest } from "@/lib/data";
import { notFound } from "next/navigation";
import { ReportForm } from "@/components/report-form";

interface ReportPageProps {
    params: {
        id: string;
    }
}

export default async function ReportPage({ params }: ReportPageProps) {
    const request = await getRequest(params.id);

    if (!request) {
        notFound();
    }
    
    // You might want to add logic here to prevent creating a report
    // if one already exists or if the status is not 'released'.

    return (
        <ReportForm request={request} />
    )
}
