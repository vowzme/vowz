import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import SEOHead from "@/components/SEOHead";
import { Calendar, User, ArrowLeft } from "lucide-react";

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover_image_url: string | null;
  author_name: string;
  tags: string[];
  published_at: string;
}

function renderMarkdown(text: string) {
  // Simple markdown: headings, bold, italic, links, paragraphs, lists
  return text
    .replace(/^### (.+)$/gm, '<h3 class="text-xl font-display font-semibold mt-6 mb-2">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-2xl font-display font-bold mt-8 mb-3">$1</h2>')
    .replace(/^# (.+)$/gm, '<h2 class="text-3xl font-display font-bold mt-8 mb-4">$1</h2>')
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="text-primary underline" target="_blank" rel="noopener">$1</a>')
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
    .replace(/\n\n/g, '</p><p class="mb-4 leading-relaxed font-body">')
    .replace(/^/, '<p class="mb-4 leading-relaxed font-body">')
    .concat("</p>");
}

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    supabase
      .from("blog_posts")
      .select("*")
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle()
      .then(({ data }) => {
        if (data) setPost(data as unknown as Post);
        setLoading(false);
      });
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-display font-bold">Post not found</h1>
        <Link to="/blog" className="text-primary underline">← Back to blog</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title={`${post.title} | Vowz Blog`} description={post.excerpt} />
      <article className="max-w-3xl mx-auto px-4 pt-28 pb-16">
        <Link to="/blog" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to blog
        </Link>

        {post.cover_image_url && (
          <div className="rounded-xl overflow-hidden mb-8">
            <img src={post.cover_image_url} alt={post.title} className="w-full h-64 md:h-80 object-cover" />
          </div>
        )}

        <div className="flex flex-wrap gap-1.5 mb-4">
          {(Array.isArray(post.tags) ? post.tags : []).map((tag) => (
            <Badge key={tag} variant="secondary">{tag}</Badge>
          ))}
        </div>

        <h1 className="text-3xl md:text-4xl font-display font-bold mb-4 leading-tight">{post.title}</h1>

        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-8 pb-6 border-b border-border/50">
          <span className="flex items-center gap-1"><User className="w-4 h-4" /> {post.author_name}</span>
          <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {new Date(post.published_at).toLocaleDateString()}</span>
        </div>

        <div
          className="prose prose-neutral dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(post.content) }}
        />
      </article>
    </div>
  );
}
