import React, { useState, useEffect } from "react";
import { AxiosGet, AxiosPost } from "utils/AxiosApi";
import { FIREBASE_SETTINGS_URL } from "utils/endpointConfig";

interface SettingsModalProps {
    onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
    const [activeTab, setActiveTab] = useState<"notifications" | "preferences">(
        "notifications"
    );
    const [topics, setTopics] = useState<string[]>([]);
    const [unsubscribedTopics, setUnsubscribedTopics] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingTopics, setLoadingTopics] = useState(false);

    useEffect(() => {
        setLoadingTopics(true)
        AxiosGet({
            url: process.env.NEXT_PUBLIC_BACKEND_URL + FIREBASE_SETTINGS_URL,
            title: "get firebase settings request"
        }).then(({ firebase_settings }) => {
            if (firebase_settings.subscribed_topics) {
                setTopics(firebase_settings.subscribed_topics);
            }

            if (firebase_settings.unsubscribed_topics) {
                setUnsubscribedTopics(firebase_settings.unsubscribed_topics);
            }
            setLoadingTopics(false)
        })
    }, []);

    const formatTopicName = (topic: string) => {
        // Remove the last part (country and language code, e.g., '_sy_en')
        const topicName = topic.replace(/_[a-z]{2}_[a-z]{2}$/, "");
        // Replace underscores with spaces
        return topicName.replace(/_/g, " ");
    };

    const handleUnsubscribe = async (topic: string) => {
        setLoading(true);
        try {
            let token = localStorage.getItem("FB-DEVICE-TOKEN");

            if (token) {
                await AxiosPost({
                    url:
                        process.env.NEXT_PUBLIC_BACKEND_URL +
                        "/firebase_device_tokens/unsubscribe_topic",
                    body: {
                        topic
                    },
                    title: "store firebase unsubscribe topic",
                });
                // Remove topic from localStorage after unsubscribing
                const updatedTopics = topics.filter((t: string) => t !== topic);
                const updatedUnsubscribedTopics = [...unsubscribedTopics, topic];

                setTopics(updatedTopics); // Update the state
                setUnsubscribedTopics(updatedUnsubscribedTopics); // Update unsubscribed topics state
            } else {
                console.error("Failed to unsubscribe from topic");
            }
        } catch (error) {
            console.error("Error unsubscribing from topic:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubscribe = async (topic: string) => {
        setLoading(true);
        try {
            let token = localStorage.getItem("FB-DEVICE-TOKEN");

            if (token) {
                await AxiosPost({
                    url:
                        process.env.NEXT_PUBLIC_BACKEND_URL +
                        "/firebase_device_tokens/subscribe_topic",
                    body: {
                        topic
                    },
                    title: "store firebase topic",
                });
                // Add the topic back to the subscribed list
                const updatedTopics = [...topics, topic];
                const updatedUnsubscribedTopics = unsubscribedTopics.filter(
                    (t: string) => t !== topic
                );

                setTopics(updatedTopics); // Update the state
                setUnsubscribedTopics(updatedUnsubscribedTopics); // Update unsubscribed topics state
            } else {
                console.error("Failed to subscribe to topic");
            }
        } catch (error) {
            console.error("Error subscribing to topic:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleOutsideClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if ((e.target as HTMLElement).classList.contains("modal-overlay")) {
            onClose();
        }
    };

    return (
        <div
            className="modal-overlay fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center"
            onClick={handleOutsideClick}
        >
            <div
                className="modal-content bg-white rounded-lg shadow-lg w-96 p-4"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Tabs */}
                <div className="tabs flex justify-between border-b mb-4">
                    <button
                        className={`tab ${activeTab === "notifications"
                            ? "border-b-2 border-blue-500 text-blue-500"
                            : "text-gray-500"
                            } py-2 px-4`}
                        onClick={() => setActiveTab("notifications")}
                    >
                        Notifications
                    </button>
                    <button
                        className={`tab ${activeTab === "preferences"
                            ? "border-b-2 border-blue-500 text-blue-500"
                            : "text-gray-500"
                            } py-2 px-4`}
                        onClick={() => setActiveTab("preferences")}
                    >
                        Preferences
                    </button>
                </div>

                {/* Content */}
                <div className="tab-content">
                    {activeTab === "notifications" && (
                        <div className="notifications-tab">
                            {topics?.length > 0 ? (
                                <ul className="space-y-2 max-h-[200px] overflow-scroll">
                                    {topics.map((topic, index) => (
                                        <li
                                            key={index}
                                            className="flex justify-between items-center bg-gray-100 p-2 rounded"
                                        >
                                            <span className="text-gray-700">{formatTopicName(topic)}</span>
                                            <button
                                                className="text-red-500 hover:text-red-700"
                                                disabled={loading}
                                                onClick={() => handleUnsubscribe(topic)}
                                            >
                                                {loading ? "Unsubscribing..." : "Unsubscribe"}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-gray-500">{loadingTopics ? "Loading Topics..." : "No topics subscribed."}</p>
                            )}

                            {/* Unsubscribed topics */}
                            {unsubscribedTopics?.length > 0 && (
                                <div className="mt-4">
                                    <p className="text-gray-500">Unsubscribed Topics:</p>
                                    <ul className="space-y-2 max-h-[200px] overflow-scroll">
                                        {unsubscribedTopics.map((topic, index) => (
                                            <li
                                                key={index}
                                                className="flex justify-between items-center bg-gray-100 p-2 rounded"
                                            >
                                                <span className="text-gray-700">{formatTopicName(topic)}</span>
                                                <button
                                                    className="text-blue-500 hover:text-blue-700"
                                                    disabled={loading}
                                                    onClick={() => handleSubscribe(topic)}
                                                >
                                                    {loading ? "Subscribing..." : "Subscribe"}
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                    {activeTab === "preferences" && (
                        <div className="preferences-tab">
                            <p className="text-gray-500">Preferences settings go here.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
