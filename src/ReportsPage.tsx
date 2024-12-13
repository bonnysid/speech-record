import React, { FC } from 'react';
import { FileUpload } from './FileUpload';

export const ReportsPage: FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <FileUpload />
    </div>
  );
}
