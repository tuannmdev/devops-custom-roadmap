import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase-server";
import { CrawlControlPanel } from "@/components/admin/CrawlControlPanel";
import { CustomUrlCrawler } from "@/components/admin/CustomUrlCrawler";
import { CrawledContentReview } from "@/components/admin/CrawledContentReview";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const metadata = {
  title: "AWS Content Crawling - Admin Dashboard",
  description: "Manage AWS content crawling operations",
};

export default async function AdminCrawlingPage() {
  const supabase = await createServerClient();

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/signin?redirectTo=/admin/crawling");
  }

  // Check if user is admin (you can add an is_admin field to user_profiles table)
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("email, role")
    .eq("user_id", user.id)
    .single();

  // For now, check if email contains "admin" or add your admin email
  // TODO: Implement proper role-based access control
  const isAdmin = profile?.role === "admin" || profile?.email?.includes("admin");

  if (!isAdmin) {
    redirect("/dashboard");
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">AWS Content Crawling Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Manage automated content aggregation from AWS sources
        </p>
      </div>

      <Tabs defaultValue="control" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="control">Crawl Control</TabsTrigger>
          <TabsTrigger value="custom">Custom URLs</TabsTrigger>
          <TabsTrigger value="review">Content Review</TabsTrigger>
        </TabsList>

        <TabsContent value="control" className="space-y-6">
          <CrawlControlPanel />
        </TabsContent>

        <TabsContent value="custom" className="space-y-6">
          <CustomUrlCrawler />
        </TabsContent>

        <TabsContent value="review" className="space-y-6">
          <CrawledContentReview />
        </TabsContent>
      </Tabs>
    </div>
  );
}
