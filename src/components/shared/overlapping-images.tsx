import React from "react";
import Image from "next/image";

type User = {
  name: string;
  image: string;
};

type OverlappingImagesProps = {
  users: User[];
};

const OverlappingImages: React.FC<OverlappingImagesProps> = ({ users }) => {
  const limitedUsers = users.slice(0, 3);

  return (
    <div className="flex -space-x-5">
      {limitedUsers.map((user, index) => (
        <Image
          key={index}
          src={user.image}
          alt={user.name}
          className="w-7 h-7 rounded-full object-cover"
          style={{ zIndex: limitedUsers.length - index }}
        />
      ))}

      {users.length > 3 && (
        <div
          className="w-9 flex items-center justify-center text-aquario-primary dark:text-white pl-9 pr-3"
          style={{ zIndex: 0 }}
        >
          +{users.length - 3}
        </div>
      )}
    </div>
  );
};

export default OverlappingImages;
