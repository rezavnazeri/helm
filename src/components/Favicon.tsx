import React, { useState } from 'react';
import Icon from '@/components/Icon';
import { bookmarkFaviconUrl } from '@/utils/links';

interface FaviconProps {
  url: string;
  className: string;
}

const Favicon: React.FC<FaviconProps> = ({ url, className }) => {
  const [broken, setBroken] = useState(false);

  if (broken) {
    return (
      <span className={`${className} favicon-fallback`}>
        <Icon name="globe" size={16} />
      </span>
    );
  }

  return (
    <img
      className={className}
      src={bookmarkFaviconUrl(url)}
      alt=""
      loading="lazy"
      draggable={false}
      onError={() => setBroken(true)}
    />
  );
};

export default Favicon;
