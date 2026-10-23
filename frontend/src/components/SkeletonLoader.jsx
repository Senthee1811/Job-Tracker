import React from 'react';

export const SkeletonCard = () => {
  return (
    <div className="p-5 bg-white border-2 border-neutral-200 rounded-2xl animate-pulse space-y-4 shadow-[3px_3px_0px_0px_rgba(200,200,200,0.5)]">
      <div className="flex justify-between items-start">
        <div className="space-y-2 flex-1">
          <div className="h-5 bg-neutral-200 rounded-md w-3/4"></div>
          <div className="h-3.5 bg-neutral-200 rounded-md w-1/2"></div>
        </div>
        <div className="w-12 h-12 bg-neutral-200 rounded-2xl flex-shrink-0"></div>
      </div>
      <div className="h-12 bg-neutral-100 rounded-xl"></div>
      <div className="flex gap-2">
        <div className="h-6 bg-neutral-200 rounded-lg w-16"></div>
        <div className="h-6 bg-neutral-200 rounded-lg w-20"></div>
        <div className="h-6 bg-neutral-200 rounded-lg w-16"></div>
      </div>
      <div className="pt-2 flex justify-between items-center border-t border-neutral-100">
        <div className="h-4 bg-neutral-200 rounded w-24"></div>
        <div className="h-8 bg-neutral-200 rounded-xl w-28"></div>
      </div>
    </div>
  );
};

export const SkeletonRecommendation = () => {
  return (
    <div className="p-4 bg-white border-2 border-neutral-200 rounded-2xl animate-pulse flex items-center justify-between gap-4">
      <div className="flex items-center gap-4 flex-1">
        <div className="w-14 h-14 bg-neutral-200 rounded-2xl flex-shrink-0"></div>
        <div className="space-y-2 flex-1">
          <div className="h-4 bg-neutral-200 rounded w-1/3"></div>
          <div className="h-3 bg-neutral-200 rounded w-1/4"></div>
          <div className="flex gap-2 pt-1">
            <div className="h-5 bg-neutral-100 rounded w-14"></div>
            <div className="h-5 bg-neutral-100 rounded w-16"></div>
          </div>
        </div>
      </div>
      <div className="h-9 bg-neutral-200 rounded-xl w-32 flex-shrink-0"></div>
    </div>
  );
};

export const SkeletonRow = () => {
  return (
    <tr className="animate-pulse border-b border-neutral-200">
      <td className="p-4"><div className="h-4 bg-neutral-200 rounded w-32"></div></td>
      <td className="p-4"><div className="h-4 bg-neutral-200 rounded w-24"></div></td>
      <td className="p-4"><div className="h-4 bg-neutral-200 rounded w-16"></div></td>
      <td className="p-4"><div className="h-4 bg-neutral-200 rounded w-20"></div></td>
      <td className="p-4"><div className="h-8 bg-neutral-200 rounded-xl w-24"></div></td>
    </tr>
  );
};
