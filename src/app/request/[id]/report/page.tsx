
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
    
    if (request.status !== 'released') {
        return (
            <div className="flex items-center justify-center h-full">
                <p>Hanya permintaan yang sudah dicairkan yang dapat dibuatkan laporannya.</p>
            </div>
        )
    }

    return (
        <ReportForm request={request} />
    )
}
