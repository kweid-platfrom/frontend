import React from "react";
import PropTypes from "prop-types";
import classNames from "classnames";

const SkeletonLoader = ({ type, count = 1, className }) => {
    const skeletonBase = "animate-pulse bg-gray-200 rounded";
    
    const renderSkeleton = () => {
        switch (type) {
            case "avatar":
                return (
                    <div className="flex space-x-4">
                        {[...Array(count)].map((_, index) => (
                            <div key={index} className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-gray-300" />
                        ))}
                    </div>
                );

            case "text":
                return (
                    <div className="space-y-2">
                        {[...Array(count)].map((_, index) => (
                            <div key={index} className={classNames(skeletonBase, "h-4 w-full md:w-3/4")} />
                        ))}
                    </div>
                );

            case "card":
                return (
                    <div className="p-4 border rounded-lg shadow-md w-full max-w-sm">
                        <div className={classNames(skeletonBase, "h-40 w-full mb-4")} />
                        <div className={classNames(skeletonBase, "h-6 w-3/4 mb-2")} />
                        <div className={classNames(skeletonBase, "h-4 w-1/2")} />
                    </div>
                );

            case "grid":
                return (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {[...Array(count)].map((_, index) => (
                            <div key={index} className={classNames(skeletonBase, "h-24 md:h-32 w-full")} />
                        ))}
                    </div>
                );
                
            case "activityFeed":
                return (
                    <div className="space-y-4 w-full">
                        {[...Array(count)].map((_, index) => (
                            <div key={index} className="flex items-start space-x-3 p-3 border border-gray-100 rounded-lg">
                                <div className={classNames(skeletonBase, "h-10 w-10 rounded-full flex-shrink-0")} />
                                <div className="w-full space-y-2">
                                    <div className="flex justify-between items-center">
                                        <div className={classNames(skeletonBase, "h-4 w-1/3")} />
                                        <div className={classNames(skeletonBase, "h-3 w-20")} />
                                    </div>
                                    <div className={classNames(skeletonBase, "h-3 w-2/3")} />
                                    <div className={classNames(skeletonBase, "h-16 w-full")} />
                                    <div className="flex justify-between items-center pt-2">
                                        <div className="flex space-x-2">
                                            <div className={classNames(skeletonBase, "h-6 w-16")} />
                                            <div className={classNames(skeletonBase, "h-6 w-16")} />
                                        </div>
                                        <div className={classNames(skeletonBase, "h-6 w-20")} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                );

            case "list":
            default:
                return (
                    <div className="space-y-3 w-full">
                        {[...Array(count)].map((_, index) => (
                            <div key={index} className="flex items-center space-x-4">
                                <div className={classNames(skeletonBase, "h-10 w-10 md:h-12 md:w-12 rounded-full")} />
                                <div className="w-full">
                                    <div className={classNames(skeletonBase, "h-4 w-3/4 mb-2")} />
                                    <div className={classNames(skeletonBase, "h-3 w-1/2")} />
                                </div>
                            </div>
                        ))}
                    </div>
                );
        }
    };

    return <div className={classNames("w-full", className)}>{renderSkeleton()}</div>;
};

SkeletonLoader.propTypes = {
    type: PropTypes.oneOf(["list", "grid", "card", "avatar", "text", "activityFeed"]),
    count: PropTypes.number,
    className: PropTypes.string,
};

export default SkeletonLoader;