"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircleQuestion, Loader2, BadgeCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as reviewsApi from "@/lib/api/reviews";

interface QnaAnswer {
  id: string;
  answer: string;
  isOfficial: boolean;
  upvotes: number;
  createdAt: string;
}

interface QnaQuestion {
  id: string;
  question: string;
  upvotes: number;
  createdAt: string;
  answers: QnaAnswer[];
}

interface QnaSectionProps {
  productId: string;
  questions: QnaQuestion[];
}

export function QnaSection({ productId, questions: initial }: QnaSectionProps) {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [items, setItems] = useState<QnaQuestion[]>(initial);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!session) {
      toast({
        title: "Please login to ask a question",
        variant: "destructive",
      });
      return;
    }
    if (draft.trim().length < 10) {
      toast({
        title: "Question is too short",
        description: "Please provide more detail",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    try {
      const q = await reviewsApi.askQuestion(productId, draft.trim());
      setItems((prev) => [
        {
          id: q.id,
          question: q.question,
          upvotes: q.upvotes,
          createdAt: q.createdAt,
          answers: [],
        },
        ...prev,
      ]);
      setDraft("");
      toast({
        title: "Question submitted",
        description: "It will appear after review.",
      });
    } catch (e) {
      toast({
        title: "Failed to submit",
        description: e instanceof Error ? e.message : "",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <MessageCircleQuestion className="w-5 h-5" /> Ask a question
          </h3>
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Ask anything about this product…"
            rows={3}
            maxLength={500}
          />
          <div className="flex justify-end mt-3">
            <Button
              onClick={submit}
              disabled={loading || !draft.trim()}
              className="bg-[#F38508] hover:bg-[#D97706] text-black font-bold"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Submit Question
            </Button>
          </div>
        </CardContent>
      </Card>

      {items.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-gray-500 text-sm">
            No questions yet. Be the first to ask.
          </CardContent>
        </Card>
      ) : (
        items.map((q) => (
          <Card key={q.id}>
            <CardContent className="p-5 space-y-3">
              <div>
                <p className="font-semibold">{q.question}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Asked {new Date(q.createdAt).toLocaleDateString()}
                </p>
              </div>
              {q.answers.length === 0 ? (
                <p className="text-sm text-gray-500 italic">
                  No answers yet — be the first to answer!
                </p>
              ) : (
                <div className="border-l-2 border-gray-200 pl-4 space-y-3">
                  {q.answers.map((a) => (
                    <div key={a.id}>
                      <p className="text-sm text-gray-800">{a.answer}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                        {a.isOfficial && (
                          <span className="flex items-center gap-1 text-blue-600 font-medium">
                            <BadgeCheck className="w-3 h-3" />
                            Official
                          </span>
                        )}
                        <span>
                          {new Date(a.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
