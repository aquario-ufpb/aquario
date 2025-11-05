"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";
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
  basePath?: string;
};

/**
 * Transforms relative image paths in markdown to absolute paths
 * that can be served via Next.js
 */
const transformImagePaths = (content: string, basePath?: string): string => {
  if (!basePath) {
    return content;
  }

  // Match markdown image syntax: ![alt](path)
  return content.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, path) => {
    // Skip if already an absolute URL (http/https)
    if (path.startsWith("http://") || path.startsWith("https://")) {
      return match;
    }

    // Handle relative paths
    if (path.startsWith("./") || path.startsWith("../") || !path.startsWith("/")) {
      // Convert relative path to absolute path from content directory
      // basePath format: /guias/{curso}/{guia}/{secao}
      // We need to construct path to content/aquario-guias/{curso}/...

      // Remove leading ./ or ../
      const cleanPath = path.replace(/^\.\//, "").replace(/^\.\.\//, "");

      // Construct the image URL path
      // Images are in content/aquario-guias, so we'll serve them via /api/content-images
      const parts = basePath.split("/").filter(p => p);
      // Remove /guias prefix if present
      const contentPath = parts.slice(1).join("/");

      // Build image path: for ./assets/image.png in /guias/curso/guia/secao
      // The basePath includes the section slug, but markdown files can be:
      // 1. Direct files: guia/secao.md -> assets are at guia/assets/
      // 2. In folders: guia/secao/secao.md -> assets are at guia/secao/assets/
      // Since sections are typically markdown files (not folders), relative paths
      // should be resolved relative to the parent of the section, not the section itself
      let imagePath: string;
      if (path.startsWith("../")) {
        // Relative path going up
        const upLevels = (path.match(/\.\.\//g) || []).length;
        const pathParts = contentPath.split("/");
        const parentPath = pathParts.slice(0, -upLevels - 1).join("/");
        imagePath = `${parentPath}/${cleanPath.replace(/^\.\.\//, "")}`;
      } else {
        // Relative to current section - but section is usually a file, so go up one level
        // For ./assets/image.png, if section is "complementares-flexiveis" (a file),
        // the assets folder is at the parent level (where the section file is)
        const pathParts = contentPath.split("/");
        // If this is a relative path starting with ./, it's relative to the section's directory
        // Since sections are markdown files, we need to remove the last segment (section slug)
        // and use the parent directory
        const parentPath = pathParts.slice(0, -1).join("/");
        imagePath = `${parentPath}/${cleanPath}`;
      }

      // Remove leading slash if present
      imagePath = imagePath.replace(/^\//, "");

      // Return markdown with transformed path
      return `![${alt}](/api/content-images/${imagePath})`;
    }

    return match;
  });
};

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, breadcrumbs, basePath }) => {
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted ? (resolvedTheme || theme) === "dark" : false;

  // Transform image paths before rendering
  const processedContent = React.useMemo(
    () => transformImagePaths(content, basePath),
    [content, basePath]
  );

  return (
    <div className="h-full overflow-y-auto flex flex-col md:pt-8 pb-8">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <div className="mb-6">
          <Breadcrumb>
            <BreadcrumbList style={{ color: isDark ? '#C8E6FA' : '#0e3a6c' }}>
              {breadcrumbs.map((item, index) => {
                const isLast = index === breadcrumbs.length - 1;
                return (
                  <React.Fragment key={index}>
                    <BreadcrumbItem>
                      {isLast ? (
                        <BreadcrumbPage style={{ color: isDark ? '#E5F6FF' : '#0e3a6c' }}>{item.label}</BreadcrumbPage>
                      ) : item.href ? (
                        <BreadcrumbLink asChild className="hover:opacity-80 transition-opacity">
                          <Link href={item.href} style={{ color: isDark ? '#C8E6FA' : '#0e3a6c' }}>{item.label}</Link>
                        </BreadcrumbLink>
                      ) : (
                        <BreadcrumbPage style={{ color: isDark ? '#E5F6FF' : '#0e3a6c' }}>{item.label}</BreadcrumbPage>
                      )}
                    </BreadcrumbItem>
                    {!isLast && (
                      <BreadcrumbSeparator>
                        <ChevronRight style={{ color: isDark ? '#C8E6FA' : '#0e3a6c' }} />
                      </BreadcrumbSeparator>
                    )}
                  </React.Fragment>
                );
              })}
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      )}
      <div 
        className="prose-base dark:prose-invert w-full prose max-w-none"
        style={{
          color: isDark ? '#E5F6FF' : '#0e3a6c',
        }}
      >
        <ReactMarkdown
          components={{
            a: ({ node, ...props }) => {
              return (
                <a
                  {...props}
                  style={{
                    color: isDark ? '#D0EFFF' : '#0e3a6c',
                    textDecoration: 'underline',
                  }}
                  className="hover:opacity-80 transition-opacity"
                />
              );
            },
            // eslint-disable-next-line @next/next/no-img-element
            img: ({ node, ...props }) => {
              const src = props.src || "";
              // If it's from our API, use regular img tag (Next.js Image requires external domains)
              if (src.startsWith("/api/")) {
                return (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    {...props}
                    src={src}
                    alt={props.alt || ""}
                    className="max-w-full h-auto rounded-lg"
                  />
                );
              }
              // For external images, use regular img
              return (
                // eslint-disable-next-line @next/next/no-img-element
                <img {...props} alt={props.alt || ""} className="max-w-full h-auto rounded-lg" />
              );
            },
          }}
        >
          {processedContent}
        </ReactMarkdown>
      </div>
    </div>
  );
};

export default MarkdownRenderer;
