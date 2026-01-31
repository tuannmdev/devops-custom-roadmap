"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, BookOpen, Lightbulb, FileText } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

interface TopicContentProps {
  topic: {
    id: string;
    title: string;
    description: string;
    topic_type: string;
    difficulty_level: string;
    estimated_minutes: number;
  };
  content: {
    content: string;
    content_type: string;
    quiz_data?: any;
  } | null;
}

export function TopicContent({ topic, content }: TopicContentProps) {
  const getTopicTypeIcon = (type: string) => {
    switch (type) {
      case "lesson":
        return <BookOpen className="w-5 h-5" />;
      case "lab":
        return <Lightbulb className="w-5 h-5" />;
      case "quiz":
        return <FileText className="w-5 h-5" />;
      default:
        return <BookOpen className="w-5 h-5" />;
    }
  };

  const getTopicTypeColor = (type: string) => {
    switch (type) {
      case "lesson":
        return "info";
      case "lab":
        return "warning";
      case "quiz":
        return "secondary";
      case "project":
        return "success";
      default:
        return "default";
    }
  };

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case "beginner":
        return "success";
      case "intermediate":
        return "warning";
      case "advanced":
        return "destructive";
      default:
        return "default";
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Topic Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Badge variant={getTopicTypeColor(topic.topic_type)}>
            {topic.topic_type}
          </Badge>
          <Badge variant={getDifficultyColor(topic.difficulty_level)}>
            {topic.difficulty_level}
          </Badge>
          {topic.estimated_minutes && (
            <div className="flex items-center text-sm text-gray-600 ml-2">
              <Clock className="w-4 h-4 mr-1" />
              {topic.estimated_minutes} minutes
            </div>
          )}
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-3">{topic.title}</h1>

        {topic.description && (
          <p className="text-lg text-gray-600">{topic.description}</p>
        )}
      </div>

      {/* Content */}
      {content ? (
        <div className="prose prose-lg max-w-none">
          {content.content_type === "markdown" && (
            <div className="bg-white rounded-lg border p-8">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code({ node, inline, className, children, ...props }: any) {
                    const match = /language-(\w+)/.exec(className || "");
                    return !inline && match ? (
                      <SyntaxHighlighter
                        style={vscDarkPlus}
                        language={match[1]}
                        PreTag="div"
                        {...props}
                      >
                        {String(children).replace(/\n$/, "")}
                      </SyntaxHighlighter>
                    ) : (
                      <code className={className} {...props}>
                        {children}
                      </code>
                    );
                  },
                }}
              >
                {content.content}
              </ReactMarkdown>
            </div>
          )}

          {content.content_type === "video" && (
            <Card>
              <CardHeader>
                <CardTitle>Video Lesson</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center">
                  <p className="text-white">Video player placeholder</p>
                </div>
                {content.content && (
                  <div className="mt-4 text-sm text-gray-600">
                    <ReactMarkdown>{content.content}</ReactMarkdown>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {content.content_type === "quiz" && content.quiz_data && (
            <Card>
              <CardHeader>
                <CardTitle>Quiz</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-gray-600">
                    Quiz functionality will be implemented here.
                  </p>
                  <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto">
                    {JSON.stringify(content.quiz_data, null, 2)}
                  </pre>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="w-12 h-12 mx-auto text-gray-400 mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Content Coming Soon
            </h3>
            <p className="text-gray-600">
              The content for this topic is currently being prepared.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
