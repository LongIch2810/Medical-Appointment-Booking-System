import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Newspaper } from "lucide-react";
import { useArticlesInfinite, useTopics } from "@/hooks/useArticles";
import { useDebounce } from "@/hooks/useDebounce";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import MedicalAiLoading from "@/components/loading/MedicalAiLoading";
import Loading from "@/components/loading/Loading";
import ErrorState from "@/components/notification/ErrorState";
import NotFoundResult from "@/components/notification/NotFoundResult";
import type { Article } from "@/types/interface/article.interface";
import { cn } from "@/lib/utils";

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
  const [topicSlug, setTopicSlug] = useState<string | undefined>();
  const debouncedSearch = useDebounce(search, 400);

  const filters = useMemo(
    () => ({
      limit: ARTICLE_LIMIT,
      search: debouncedSearch.trim() || undefined,
      topic_slug: topicSlug,
    }),
    [debouncedSearch, topicSlug],
  );

  const {
    data: articleData,
    isLoading,
    isError,
    refetch,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useArticlesInfinite(filters);
  const { data: topicData } = useTopics({
    page: 1,
    limit: TOPIC_LIMIT,
    arrange: "asc",
  });

  const articles = useMemo(
    () => articleData?.pages.flatMap((page) => page.data.articles) ?? [],
    [articleData],
  );
  const topics = topicData?.data.topics ?? [];

  const loadMoreRef = useInfiniteScroll<HTMLDivElement>({
    hasNextPage,
    fetchNextPage,
  });

  const handleSearchChange = (value: string) => {
    setSearch(value);
  };

  const handleSelectTopic = (slug?: string) => {
    setTopicSlug(slug);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#0B1220] dark:text-[#F1F5F9] pb-16">
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
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 text-white">
                <Newspaper className="h-4.5 w-4.5" />
              </span>
              <div>
                <h1 className="text-lg font-bold leading-tight">
                  {t("news.pageTitle")}
                </h1>
                <p className="text-xs text-white/80">
                  {t("news.pageSubtitle")}
                </p>
              </div>
            </div>
          </div>

          {/* Search bar */}
          <div className="w-full md:w-80">
            <Input
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder={t("news.searchPlaceholder")}
              className="h-10 bg-white/95 text-slate-900 placeholder:text-slate-500 border-none rounded-xl text-xs sm:text-sm focus-visible:ring-2 focus-visible:ring-white/50"
            />
          </div>
        </div>
      </header>

      {/* Topic Filter Pills */}
      {topics.length > 0 && (
        <div className="container mx-auto px-4 pt-6">
          <div className="flex flex-nowrap items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            <Button
              type="button"
              variant={!topicSlug ? "default" : "outline"}
              size="sm"
              className={cn(
                "rounded-full text-xs font-semibold px-4 cursor-pointer shrink-0",
                !topicSlug
                  ? "!bg-primary !text-primary-foreground shadow-xs"
                  : "bg-white dark:bg-[#1E293B] text-slate-700 dark:text-[#CBD5E1] border-slate-200 dark:border-[#293548] hover:border-primary/40",
              )}
              onClick={() => handleSelectTopic(undefined)}
            >
              {t("news.allTopics")}
            </Button>
            {topics.map((topic) => {
              const active = topicSlug === topic.slug;
              return (
                <Button
                  key={topic.id}
                  type="button"
                  variant={active ? "default" : "outline"}
                  size="sm"
                  className={cn(
                    "rounded-full text-xs font-semibold px-4 cursor-pointer shrink-0",
                    active
                      ? "!bg-primary !text-primary-foreground shadow-xs"
                      : "bg-white dark:bg-[#1E293B] text-slate-700 dark:text-[#CBD5E1] border-slate-200 dark:border-[#293548] hover:border-primary/40",
                  )}
                  onClick={() => handleSelectTopic(topic.slug)}
                >
                  {topic.name}
                </Button>
              );
            })}
          </div>
        </div>
      )}

      {/* Articles Grid */}
      <main className="container mx-auto px-4 py-6">
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
            }}
          />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {articles.map((article) => (
                <Card
                  key={article.id}
                  className="overflow-hidden rounded-2xl border border-slate-200/80 dark:border-[#293548] bg-white dark:bg-[#172033] shadow-2xs hover:shadow-md hover:border-primary/40 transition-all duration-300 flex flex-col group py-0"
                >
                  <div className="relative overflow-hidden h-48 w-full bg-slate-100 dark:bg-[#1E293B]">
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
                      <span className="absolute top-3 left-3 rounded-full bg-white/90 dark:bg-[#172033]/90 backdrop-blur-xs px-2.5 py-0.5 text-[11px] font-bold text-primary shadow-xs">
                        {article.topic.name}
                      </span>
                    )}
                  </div>
                  <CardContent className="flex flex-col flex-grow p-5 space-y-3">
                    <Link
                      to={`/news/${article.id}`}
                      className="text-base sm:text-lg font-bold text-slate-900 dark:text-[#F1F5F9] group-hover:text-primary transition-colors line-clamp-2 font-heading leading-snug"
                    >
                      {article.title}
                    </Link>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-[#94A3B8] flex-grow line-clamp-3 leading-relaxed">
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

            {/* Sentinel cho infinite scroll — quan sát bằng IntersectionObserver
                (useInfiniteScroll), tự gọi fetchNextPage khi lọt vào viewport */}
            {hasNextPage && (
              <div ref={loadMoreRef} className="mt-10 flex items-center justify-center">
                {isFetchingNextPage && <Loading size={20} />}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default News;
