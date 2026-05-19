import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { FaSearch } from "react-icons/fa";
import { useArticles, useTopics } from "@/hooks/useArticles";
import { useDebounce } from "@/hooks/useDebounce";
import type { Article } from "@/types/interface/article.interface";

const ARTICLE_LIMIT = 6;
const TOPIC_LIMIT = 20;
const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=800&q=60";

const getArticleImage = (article: Article) => {
  if (Array.isArray(article.img_urls) && article.img_urls.length > 0) {
    return article.img_urls[0]?.url ?? FALLBACK_IMAGE;
  }
  return FALLBACK_IMAGE;
};

const getAuthorInitial = (article: Article) =>
  article.author?.fullname?.charAt(0)?.toUpperCase() ?? "?";

const News = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [topicSlug, setTopicSlug] = useState<string | undefined>();
  const debouncedSearch = useDebounce(search, 400);

  const filters = useMemo(
    () => ({
      page,
      limit: ARTICLE_LIMIT,
      search: debouncedSearch.trim() || undefined,
      topic_slug: topicSlug,
    }),
    [page, debouncedSearch, topicSlug],
  );

  const { data: articleData, isLoading, isError } = useArticles(filters);
  const { data: topicData } = useTopics({
    page: 1,
    limit: TOPIC_LIMIT,
    arrange: "asc",
  });

  const articles = articleData?.data.articles ?? [];
  const totalPages = articleData?.data.totalPages ?? 1;
  const topics = topicData?.data.topics ?? [];

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleSelectTopic = (slug?: string) => {
    setTopicSlug(slug);
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Header */}
      <header className="bg-primary text-white shadow">
        <div className="container mx-auto px-4 py-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => navigate("/")}
              className="h-9 gap-1.5 px-3 text-white hover:bg-white/15 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Trang chủ
            </Button>
            <div className="flex items-center gap-3">
              <img
                src="/logo.jpg"
                alt="LifeHealth Logo"
                className="w-10 h-10 object-contain rounded-md"
              />
              <h1 className="text-xl font-bold sm:text-2xl">LifeHealth News</h1>
            </div>
          </div>

          <div className="w-full max-w-xs md:w-auto relative text-gray-700">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              type="search"
              placeholder="Tìm kiếm bài viết..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <nav className="bg-primary/90 border-t border-primary/70 relative">
          <div
            className="topic-scroll container mx-auto flex items-center gap-2 overflow-x-auto whitespace-nowrap px-4 pt-2 pb-3 text-sm"
          >
            <button
              type="button"
              onClick={() => handleSelectTopic(undefined)}
              className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold transition ${
                !topicSlug
                  ? "border-white bg-white text-primary shadow-sm"
                  : "border-white/40 bg-white/10 text-white hover:border-white hover:bg-white hover:text-primary"
              }`}
            >
              Tất cả
            </button>
            {topics.map((topic) => (
              <button
                key={topic.id}
                type="button"
                onClick={() => handleSelectTopic(topic.slug)}
                className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold transition ${
                  topicSlug === topic.slug
                    ? "border-white bg-white text-primary shadow-sm"
                    : "border-white/40 bg-white/10 text-white hover:border-white hover:bg-white hover:text-primary"
                }`}
              >
                {topic.name}
              </button>
            ))}
          </div>
          <span
            aria-hidden
            className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-primary/90 to-transparent"
          />
        </nav>
      </header>

      <main className="container mx-auto px-4 py-10">
        {isLoading ? (
          <p className="text-center text-gray-500">Đang tải bài viết...</p>
        ) : isError ? (
          <p className="text-center text-red-500">
            Không thể tải danh sách bài viết.
          </p>
        ) : articles.length === 0 ? (
          <p className="text-center text-gray-500">
            Không tìm thấy bài viết phù hợp.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {articles.map((article) => (
                <Card
                  key={article.id}
                  className="overflow-hidden shadow-md flex flex-col"
                >
                  <img
                    src={getArticleImage(article)}
                    alt={article.title}
                    className="w-full h-48 object-cover"
                    loading="lazy"
                  />
                  <CardContent className="flex flex-col flex-grow">
                    <Link
                      to={`/news/${article.id}`}
                      className="text-xl font-bold hover:text-primary hover:underline mb-2 line-clamp-2"
                    >
                      {article.title}
                    </Link>
                    <p className="text-gray-600 flex-grow line-clamp-3">
                      {article.summary}
                    </p>

                    {article.tags?.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {article.tags.map((tag) => (
                          <span
                            key={tag.name}
                            className="text-xs bg-primary/10 text-primary rounded-full px-2 py-0.5"
                          >
                            #{tag.name}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="mt-4 flex items-center space-x-3 text-sm text-gray-500">
                      <Avatar className="w-8 h-8">
                        <AvatarImage
                          src={article.author?.picture ?? ""}
                          alt={article.author?.fullname ?? ""}
                        />
                        <AvatarFallback>
                          {getAuthorInitial(article)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-gray-700">
                          {article.author?.fullname ?? "Tác giả"}
                        </p>
                        <p>{article.created_at ?? "—"}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="mt-10 flex items-center justify-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                Trước
              </Button>
              <span className="text-sm text-gray-500">
                Trang {page}/{totalPages}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() =>
                  setPage((current) => Math.min(totalPages, current + 1))
                }
              >
                Sau
              </Button>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default News;
