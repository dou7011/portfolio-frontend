export interface ArticleData {
    id: number;
    slug: string;
    title: string;
    type: string;
    cover_image: string;
    excerpt: string;
    content: string;
    tags: string[];
    github_url: string;
    demo_url: string;
    is_published: boolean;
}