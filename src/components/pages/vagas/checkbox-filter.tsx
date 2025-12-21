"use client";

import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

type CheckboxProps = {
  data: {
    titulo: string;
    elementos: string[];
  }[];
  onChange?: (selected: string[]) => void; // Callback to the parent
};

const CheckboxGroup = ({ data, onChange }: CheckboxProps) => {
  const [selectedValues, setSelectedValues] = useState<{
    [key: string]: { [key: string]: boolean };
  }>({});

  const handleChange = (category: string, element: string) => {
    setSelectedValues(prev => {
      const categoryValues = prev[category] || {};
      const newState = {
        ...prev,
        [category]: {
          ...categoryValues,
          [element]: !categoryValues[element],
        },
      };

      // Updates the parent with the selected elements.
      if (onChange) {
        const selected: string[] = [];
        Object.values(newState).forEach(cat =>
          Object.entries(cat).forEach(([el, checked]) => {
            if (checked) {
              selected.push(el.toLowerCase());
            }
          })
        );
        onChange(selected);
      }

      return newState;
    });
  };

  return (
    <Card className="w-full mx-auto">
      <CardContent className="p-5">
        {data.map((group, index) => (
          <div key={index} className="space-y-2">
            {group.titulo !== "None" && <h3 className="text-xl">{group.titulo}</h3>}

            <div className="flex flex-col space-y-2">
              {group.elementos.map((element, idx) => (
                <label
                  key={idx}
                  className="inline-flex items-center space-x-2 pb-1 hover:underline cursor-pointer"
                >
                  <Checkbox
                    checked={selectedValues[group.titulo]?.[element] || false}
                    onClick={() => handleChange(group.titulo, element)}
                  />
                  <span className="text-sm">{element}</span>
                </label>
              ))}
            </div>

            {index !== data.length - 1 && <hr className="my-4 pb-3 border-gray-300" />}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default CheckboxGroup;
