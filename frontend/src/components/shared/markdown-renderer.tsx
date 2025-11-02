import React from "react";
import ReactMarkdown from "react-markdown";
import Link from "next/link";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

type BreadcrumbItemData = {
  label: string;
  href?: string;
};

type MarkdownRendererProps = {
  content: string;
  breadcrumbs?: BreadcrumbItemData[];
};

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, breadcrumbs }) => {
  return (
    <div className="h-full overflow-y-auto flex flex-col md:pt-14 pb-8">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <div className="mb-6">
          <Breadcrumb>
            <BreadcrumbList>
              {breadcrumbs.map((item, index) => {
                const isLast = index === breadcrumbs.length - 1;
                return (
                  <React.Fragment key={index}>
                    <BreadcrumbItem>
                      {isLast ? (
                        <BreadcrumbPage>{item.label}</BreadcrumbPage>
                      ) : item.href ? (
                        <BreadcrumbLink asChild>
                          <Link href={item.href}>{item.label}</Link>
                        </BreadcrumbLink>
                      ) : (
                        <BreadcrumbPage>{item.label}</BreadcrumbPage>
                      )}
                    </BreadcrumbItem>
                    {!isLast && <BreadcrumbSeparator />}
                  </React.Fragment>
                );
              })}
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      )}
      <div className="prose-base dark:prose-invert w-full prose max-w-none">
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
    </div>
  );
};

export default MarkdownRenderer;
