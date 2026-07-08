import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import SEOHead from "@/components/SEOHead";
import { Calendar, User, ArrowLeft } from "lucide-react";
import { marked } from "marked";
import DOMPurify from "dompurify";

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
  // Parse markdown to HTML, then sanitize to strip any raw HTML / script / event handlers.
  const rawHtml = marked.parse(text ?? "", { async: false, gfm: true, breaks: true }) as string;
  return DOMPurify.sanitize(rawHtml, {
    USE_PROFILES: { html: true },
    FORBID_TAGS: ["script", "style", "iframe", "object", "embed", "form"],
    FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover", "onfocus", "onblur", "style"],
  });
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
      <SEOHead
        title={`${post.title} | Vowz Blog`}
        description={post.excerpt}
        ogType="article"
        ogUrl={`https://vowz.me/blog/${post.slug}`}
        canonical={`https://vowz.me/blog/${post.slug}`}
        ogImage={post.cover_image_url || undefined}
      >
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: post.title,
            description: post.excerpt,
            image: post.cover_image_url || undefined,
            author: { "@type": "Person", name: post.author_name },
            datePublished: post.published_at,
            mainEntityOfPage: {
              "@type": "WebPage",
              "@id": `https://vowz.me/blog/${post.slug}`,
            },
            publisher: {
              "@type": "Organization",
              name: "Vowz",
              url: "https://vowz.me",
            },
            keywords: (post.tags || []).join(", "),
          })}
        </script>
      </SEOHead>
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
