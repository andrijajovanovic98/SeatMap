import { SharedPlanNotFound } from "@/components/SharedPlanNotFound";
import { SharedPlanView } from "@/components/SharedPlanView";
import { loadSharedPlan } from "@/lib/shareStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function SharePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const plan = await loadSharedPlan(id);

  if (!plan) {
    return <SharedPlanNotFound />;
  }

  return <SharedPlanView plan={plan} />;
}
