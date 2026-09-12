import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CalendarDays, Tag as TagIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import MedicalAiLoading from "@/components/loading/MedicalAiLoading";
import { useArticleDetail, useArticles } from "@/hooks/useArticles";
import type { Article } from "@/types/interface/article.interface";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1200&q=70";

const getCoverImage = (article?: Article) => {
  if (!article) return FALLBACK_IMAGE;
  if (Array.isArray(article.img_urls) && article.img_urls.length > 0) {
    return article.img_urls[0]?.url ?? FALLBACK_IMAGE;
  }
  return FALLBACK_IMAGE;
};

const getAuthorInitial = (article?: Article) =>
  article?.author?.fullname?.charAt(0)?.toUpperCase() ?? "?";

const NewsDetail = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const articleId = Number(id) || 0;

  const { data, isLoading, isError } = useArticleDetail(articleId);
  const article = data?.data;

  const { data: relatedData } = useArticles({
    page: 1,
    limit: 4,
    topic_slug: article?.topic?.slug,
  });
  const relatedArticles = (relatedData?.data.articles ?? []).filter(
    (item) => item.id !== articleId,
  );

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <MedicalAiLoading
          label={t("news.loadingDetailLabel")}
          description={t("news.loadingDetailDesc")}
        />
      </div>
    );
  }

  if (isError || !article) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-lg text-red-500">{t("news.articleNotFound")}</p>
        <Button className="mt-6" onClick={() => navigate("/news")}>
          <ArrowLeft className="h-4 w-4" />
          {t("news.backToNews")}
        </Button>
      </div>
    );
  }

  const images = Array.isArray(article.img_urls) ? article.img_urls : [];

  return (
    <div className="bg-slate-50 dark:bg-[#0B1220] text-slate-900 dark:text-[#F1F5F9] min-h-screen">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-primary dark:text-teal-400 dark:hover:bg-[#1E293B]"
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="h-4 w-4" />
            {t("news.backToHome")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 dark:border-[#293548] dark:bg-[#1E293B] dark:text-[#CBD5E1]"
            onClick={() => navigate("/news")}
          >
            <ArrowLeft className="h-4 w-4" />
            {t("news.backToNews")}
          </Button>
        </div>

        <article className="bg-white rounded-2xl shadow-sm overflow-hidden dark:bg-[#172033] dark:border dark:border-[#293548]">
          <img
            src={getCoverImage(article)}
            alt={article.title}
            className="w-full h-72 md:h-96 object-cover"
            loading="lazy"
          />

          <div className="p-6 md:p-10 space-y-6">
            <div className="space-y-3">
              {article.topic?.name && (
                <Link
                  to={`/news?topic=${article.topic.slug ?? ""}`}
                  className="inline-block text-xs font-semibold uppercase tracking-wider text-primary dark:text-teal-400"
                >
                  {article.topic.name}
                </Link>
              )}
              <h1 className="text-2xl md:text-4xl font-bold leading-tight text-slate-900 dark:text-[#F1F5F9]">
                {article.title}
              </h1>
              {article.summary && (
                <p className="text-base md:text-lg text-slate-600 dark:text-[#CBD5E1]">
                  {article.summary}
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 dark:text-[#94A3B8]">
              <div className="flex items-center gap-2">
                <Avatar className="h-9 w-9">
                  <AvatarImage
                    src={article.author?.picture ?? ""}
                    alt={article.author?.fullname ?? ""}
                  />
                  <AvatarFallback>{getAuthorInitial(article)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-slate-700 dark:text-[#CBD5E1]">
                    {article.author?.fullname ?? t("news.authorLabel")}
                  </p>
                  {article.author?.email && (
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      {article.author.email}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <CalendarDays className="h-4 w-4" />
                <span>{article.created_at ?? "—"}</span>
              </div>
            </div>

            {article.tags?.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <TagIcon className="h-4 w-4 text-slate-400" />
                {article.tags.map((tag) => (
                  <span
                    key={tag.name}
                    className="text-xs bg-primary/10 text-primary dark:bg-primary/20 dark:text-teal-300 rounded-full px-2 py-0.5"
                  >
                    #{tag.name}
                  </span>
                ))}
              </div>
            )}

            <Separator className="dark:bg-[#293548]" />

            <div
              className="prose prose-slate dark:prose-invert max-w-none prose-img:rounded-xl prose-headings:scroll-mt-20 dark:text-[#CBD5E1]"
              dangerouslySetInnerHTML={{ __html: article.content }}
            />

            {images.length > 1 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-4">
                {images.slice(1).map((image) => (
                  <img
                    key={image.public_id ?? image.url}
                    src={image.url}
                    alt={article.title}
                    className="w-full h-40 object-cover rounded-lg"
                    loading="lazy"
                  />
                ))}
              </div>
            )}
          </div>
        </article>

        {relatedArticles.length > 0 && (
          <section className="mt-12 space-y-4">
            <h2 className="text-xl md:text-2xl font-semibold text-slate-900 dark:text-slate-100">
              {t("news.relatedArticlesTitle")}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedArticles.slice(0, 3).map((item) => (
                <Card
                  key={item.id}
                  className="overflow-hidden flex flex-col shadow-sm dark:border-slate-800 dark:bg-slate-900"
                >
                  <Link to={`/news/${item.id}`}>
                    <img
                      src={getCoverImage(item)}
                      alt={item.title}
                      className="w-full h-40 object-cover"
                      loading="lazy"
                    />
                  </Link>
                  <CardContent className="flex flex-col flex-grow gap-2">
                    <Link
                      to={`/news/${item.id}`}
                      className="font-semibold hover:text-primary line-clamp-2 text-slate-900 dark:text-slate-100 dark:hover:text-primary"
                    >
                      {item.title}
                    </Link>
                    <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
                      {item.summary}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-auto">
                      {item.created_at ?? "—"}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default NewsDetail;
