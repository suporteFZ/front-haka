import React from "react";

interface JsonLdProps {
  data: Record<string, any> | Array<Record<string, any>> | null;
}

export default function JsonLd({ data }: JsonLdProps) {
  if (!data) return null;

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
