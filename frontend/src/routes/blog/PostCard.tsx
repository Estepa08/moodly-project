import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Card } from '../../components/ui/card';
import Reveal from '../../components/Reveal';
import { getCategoryName, formatDate, type Post } from './posts';

export function PostCard({ post, delay = 0 }: { post: Post; delay?: number }) {
  return (
    <Reveal delay={delay} className="h-full">
      <Card className="p-6 flex flex-col h-full">
        <span className="self-start rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          {getCategoryName(post.category)}
        </span>
        <Link
          to={`/blog/${post.slug}`}
          className="mt-3 font-bold text-foreground hover:text-primary transition-colors"
        >
          {post.title}
        </Link>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed flex-1">{post.excerpt}</p>
        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{formatDate(post.date)}</span>
          <Link
            to={`/blog/${post.slug}`}
            className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
          >
            Читать
            <ArrowRight aria-hidden="true" className="w-4 h-4" />
          </Link>
        </div>
      </Card>
    </Reveal>
  );
}
