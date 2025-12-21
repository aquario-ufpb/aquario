import React, { Children } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

type coursesProps = {
  icon: React.ElementType;
  children: React.ReactNode;
};

function InfoCardsComponent({ icon: Icon, children }: coursesProps) {
  const [tittle, description] = Children.toArray(children);

  return (
    <Card
      className="h-[200px] dark:text-dark-text dark:border-white hover:border-aquario-primary hover:cursor-pointer 
                     transform hover:scale-105 transition-all duration-300 hover:text-aquario-primary"
    >
      <CardHeader>
        <Icon className="w-6 h-6" />
      </CardHeader>
      <CardContent>
        <CardTitle className="mt-10">{tittle}</CardTitle>
        <CardDescription className="mt-3">{description}</CardDescription>
      </CardContent>
    </Card>
  );
}

export default InfoCardsComponent;
