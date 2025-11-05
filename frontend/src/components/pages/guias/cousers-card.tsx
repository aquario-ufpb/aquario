import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import React, { FC, ReactNode } from "react";
import { Settings, Monitor, Brain } from "lucide-react";

type CourseCardProps = {
  iconName: string;
  children: ReactNode;
};

const iconMap = {
  gear: Settings,
  monitor: Monitor,
  lightbulb: Brain,
};

const CourseCard: FC<CourseCardProps> = ({ iconName, children }) => {
  const Icon = iconMap[iconName as keyof typeof iconMap];

  return (
    <Card
      className="h-auto dark:text-dark-text dark:border-slate-600 hover:border-aquario-primary hover:cursor-pointer 
                     hover:text-aquario-primary dark:hover:border-slate-200"
    >
      <CardHeader>
        <Icon className="w-6 h-6" />
      </CardHeader>
      <CardContent className="mt-12">
        <CardTitle>{children}</CardTitle>
      </CardContent>
    </Card>
  );
};

export default CourseCard;
