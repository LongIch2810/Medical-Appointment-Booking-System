import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronLeft, ChevronRight, Newspaper, Search } from "lucide-react";
import { useArticles, useTopics } from "@/hooks/useArticles";
import { useDebounce } from "@/hooks/useDebounce";
import MedicalAiLoading from "@/components/loading/MedicalAiLoading";
import ErrorState from "@/components/notification/ErrorState";
import NotFoundResult from "@/components/notification/NotFoundResult";
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
  const { t } = useTranslation();
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

  const { data: articleData, isLoading, isError, refetch } = useArticles(filters);
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
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 pb-16">
      {/* Header */}
      <header className="bg-gradient-to-r from-teal-800 via-primary to-teal-700 text-white shadow-md">
        <div className="container mx-auto px-4 py-4.5 flex flex-col gap-3.5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => navigate("/")}
              className="h-9 gap-1.5 px-3 text-white hover:bg-white/15 hover:text-white rounded-xl cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              {t("news.backToHome")}
            </Button>
            <div className="flex items-center gap-2.5">
              <img
                src="/logo.jpg"
                alt="LifeHealth Logo"
                className="w-9 h-9 object-cover rounded-xl border border-white/30"
              />
              <div>
                <h1 className="text-lg font-extrabold sm:text-xl font-heading flex items-center gap-1.5">
                  <Newspaper className="h-4.5 w-4.5 text-teal-200" />
                  LifeHealth News
                </h1>
              </div>
            </div>
          </div>

          <div className="w-full max-w-sm md:w-auto relative text-slate-700 dark:text-slate-200">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
            <Input
              type="search"
              placeholder={t("news.searchPlaceholder")}
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10 h-10 rounded-full bg-white/95 dark:bg-slate-900/90 border-transparent placeholder:text-slate-400 text-slate-900 dark:text-slate-100 shadow-2xs text-xs sm:text-sm"
              aria-label={t("news.searchPlaceholder")}
            />
          </div>
        </div>

        <nav className="bg-teal-900/40 border-t border-white/10 relative">
          <div className="topic-scroll container mx-auto flex items-center gap-2 overflow-x-auto whitespace-nowrap px-4 py-2.5 text-xs sm:text-sm">
            <button
              type="button"
              onClick={() => handleSelectTopic(undefined)}
              className={`shrink-0 rounded-full border px-3.5 py-1 text-xs font-bold transition-all cursor-pointer ${
                !topicSlug
                  ? "border-white bg-white text-primary shadow-xs"
                  : "border-white/30 bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              {t("news.allTopics")}
            </button>
            {topics.map((topic) => (
              <button
                key={topic.id}
                type="button"
                onClick={() => handleSelectTopic(topic.slug)}
                className={`shrink-0 rounded-full border px-3.5 py-1 text-xs font-bold transition-all cursor-pointer ${
                  topicSlug === topic.slug
                    ? "border-white bg-white text-primary shadow-xs"
                    : "border-white/30 bg-white/10 text-white hover:bg-white/20"
                }`}
              >
                {topic.name}
              </button>
            ))}
          </div>
          <span
            aria-hidden
            className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-teal-900/40 to-transparent"
          />
        </nav>
      </header>

      <main className="container mx-auto px-4 py-10 max-w-7xl">
        {isLoading ? (
          <MedicalAiLoading
            label={t("news.loadingLabel")}
            description={t("news.loadingDesc")}
            minHeight="min-h-80"
          />
        ) : isError ? (
          <ErrorState
            title={t("news.errorTitle")}
            description={t("news.errorDesc")}
            onRetry={() => refetch()}
          />
        ) : articles.length === 0 ? (
          <NotFoundResult
            title={t("news.notFoundTitle")}
            description={t("news.notFoundDesc")}
            onReset={() => {
              setSearch("");
              setTopicSlug(undefined);
              setPage(1);
            }}
          />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {articles.map((article) => (
                <Card
                  key={article.id}
                  className="overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs hover:shadow-md hover:border-primary/40 transition-all duration-300 flex flex-col group py-0"
                >
                  <div className="relative overflow-hidden h-48 w-full bg-slate-100 dark:bg-slate-800">
                    <img
                      src={getArticleImage(article)}
                      alt={article.title}
                      width={400}
                      height={192}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {article.topic?.name && (
                      <span className="absolute top-3 left-3 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs px-2.5 py-0.5 text-[11px] font-bold text-primary shadow-xs">
                        {article.topic.name}
                      </span>
                    )}
                  </div>
                  <CardContent className="flex flex-col flex-grow p-5 space-y-3">
                    <Link
                      to={`/news/${article.id}`}
                      className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 group-hover:text-primary transition-colors line-clamp-2 font-heading leading-snug"
                    >
                      {article.title}
                    </Link>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 flex-grow line-clamp-3 leading-relaxed">
                      {article.summary}
                    </p>

                    {article.tags && article.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {article.tags.map((tag) => (
                          <span
                            key={tag.name}
                            className="text-[10px] font-bold bg-primary/10 text-primary dark:bg-primary/20 dark:text-teal-300 rounded-full px-2 py-0.5"
                          >
                            #{tag.name}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-2">
                        <Avatar className="w-7 h-7">
                          <AvatarImage
                            src={article.author?.picture ?? ""}
                            alt={article.author?.fullname ?? ""}
                          />
                          <AvatarFallback className="text-xs font-bold">
                            {getAuthorInitial(article)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[120px]">
                          {article.author?.fullname ?? t("news.medicalBoardAuthor")}
                        </span>
                      </div>
                      <span>{article.created_at ?? ""}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-10 flex items-center justify-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  className="rounded-xl gap-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  {t("news.prevPage")}
                </Button>
                <span className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 px-2">
                  {t("news.pageCount", { page, totalPages })}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() =>
                    setPage((current) => Math.min(totalPages, current + 1))
                  }
                  className="rounded-xl gap-1"
                >
                  {t("news.nextPage")}
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default News;
