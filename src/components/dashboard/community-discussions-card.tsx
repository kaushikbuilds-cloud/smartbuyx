import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const PLACEHOLDERS = [
  { author: "Ramesh K.", question: "Is this laptop worth buying for coding?", replies: 24 },
  { author: "Aravind S.", question: "Best cement brand in Tamil Nadu?", replies: 15 },
  { author: "Karthik M.", question: "Birla vs Ultratech — Which is better?", replies: 31 },
];

export function CommunityDiscussionsCard() {
  return (
    <Card>
      <CardContent className="space-y-3 p-5">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 font-semibold">
            <MessageSquare className="h-4 w-4" /> Community Discussions
          </h3>
          <Link href="/dashboard/customer/community" className="text-xs text-primary hover:underline">View All</Link>
        </div>
        <ul className="space-y-3">
          {PLACEHOLDERS.map((d) => (
            <li key={d.question} className="flex items-start gap-3">
              <Avatar className="h-9 w-9">
                <AvatarFallback>{d.author.slice(0, 2)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{d.question}</p>
                <p className="text-xs text-muted-foreground">
                  By {d.author} <span className="mx-1 inline-block h-1 w-1 rounded-full bg-muted-foreground" /> {d.replies} Replies
                </p>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
