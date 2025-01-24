import React, { useState, useEffect } from "react";
import axios from "axios";
import { apiRequest } from "../api/apiRequest";
import { useAuth } from "../providers/AuthProvider";

interface User {
  id: number;
  username: string;
  email: string;
  password: string;
}

interface Category {
  id: number;
  name: string;
  created_at: string;
}

interface Thread {
  id: number;
  title: string;
  content: string;
  user_id: number;
  category_id: number;
  created_at: string;
  updated_at: string;
}

interface Comment {
  id: number;
  user_id: number;
  thread_id: number;
  content: string;
  created_at: string;
  updated_at: string;
}

const Forum: React.FC = () => {
  const { user, dispatch } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newCategory, setNewCategory] = useState("");
  const [newThread, setNewThread] = useState("");
  const [newThreadContent, setNewThreadContent] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [newComment, setNewComment] = useState("");
  const [selectedThread, setSelectedThread] = useState<number | null>(null);
  const [isThreadModalOpen, setThreadModalOpen] = useState(false);
  const [isCommentModalOpen, setCommentModalOpen] = useState(false);
  const [isCategoryModalOpen, setCategoryModalOpen] = useState(false);
  const [users, setUsers] = useState<Record<number, string>>({});

  const handleAddCategory = async () => {
    try {
      const response = await apiRequest("create_category", "POST", "", {
        name: newCategory,
        created_at: new Date().toISOString(),
      });
      setCategories([...categories, response.data]);
      setNewCategory("");
      setCategoryModalOpen(false);
    } catch (error) {
      console.error("Error adding category:", error);
    }
  };

  const handleAddThread = async () => {
    if (!selectedCategory) return alert("Select a category first");
    try {
      const response = await apiRequest("create_thread", "POST", "", {
        title: newThread,
        content: newThreadContent,
        user_id: user?.id,
        category_id: selectedCategory,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      setThreads([...threads, response.data]);
      setThreadModalOpen(false);
      setNewThread("");
      setNewThreadContent("");
    } catch (error) {
      console.error("Error adding thread:", error);
    }
  };

  const handleAddComment = async () => {
    if (!selectedThread) return alert("Select a thread first");
    try {
      const response = await apiRequest("create_comment", "POST", "", {
        thread_id: selectedThread,
        user_id: user?.id,
        content: newComment,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      setComments([...comments, response.data]);
      setCommentModalOpen(false);
      setNewComment("");
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      const response = await apiRequest("get_user", "GET", `${user?.id}`);
      if (response.success) {
        dispatch({ type: "LOGIN", payload: response.data });
      } else {
        console.error("Wrong");
      }
    };
    fetchUserData();
    // console.log(selectedThread);
  }, [selectedThread]);

  useEffect(() => {
    const fetchUsers = async () => {
      const response = await apiRequest("get_users", "GET", "");
      if (response.success) {
        const filtered_users: Record<number, string> = {};
        response.data.forEach((user: User) => {
          filtered_users[user.id] = user.username;
        });
        setUsers(filtered_users);
      } else {
        console.error("Wrong");
      }
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    // Fetch initial data
    fetchCategories();
    fetchThreads();
    fetchComments();
  }, [categories]);

  const fetchCategories = async () => {
    try {
      const response = await apiRequest("get_categories", "GET", "");
      //   console.log(response);
      setCategories(response.data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchThreads = async () => {
    try {
      const response = await apiRequest("get_threads", "GET", "");
      setThreads(response.data);
    } catch (error) {
      console.error("Error fetching threads");
    }
  };

  const fetchComments = async () => {
    try {
      const response = await apiRequest("get_comments", "GET", "");
      setComments(response.data);
    } catch (error) {
      console.error("Error fetching comments");
    }
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-center">Forum</h1>

      {/* Categories as Navigation Bar */}
      <div className="flex space-x-4 overflow-x-auto border-b pb-4 mb-6">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`px-4 py-2 rounded-md ${
              selectedCategory === category.id
                ? "bg-blue-500 text-white"
                : "bg-gray-200 hover:bg-gray-300"
            }`}
          >
            {category.name}
          </button>
        ))}
        <button
          onClick={() => setCategoryModalOpen(true)}
          className="ml-auto bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
        >
          Add Category
        </button>
      </div>

      {/* Threads Section */}
      {selectedCategory && (
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Threads</h2>
            <button
              onClick={() => setThreadModalOpen(true)}
              className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
            >
              Add Thread
            </button>
          </div>
          <ul className="space-y-4">
            {threads
              .filter((thread) => thread.category_id === selectedCategory)
              .map((thread) => (
                <li
                  key={thread.id}
                  className={`p-4 border rounded-md ${
                    selectedThread === thread.id ? "bg-green-100" : "bg-white"
                  }`}
                >
                  <div
                    onClick={() =>
                      setSelectedThread(
                        selectedThread === thread.id ? null : thread.id
                      )
                    }
                    className="cursor-pointer"
                  >
                    <h3 className="font-bold">{thread.title}</h3>
                    <p className="text-gray-600">{thread.content}</p>
                    <p className="text-sm text-gray-500">
                      Posted by {users[thread.user_id]} on{" "}
                      {new Intl.DateTimeFormat("en-GB", {
                        dateStyle: "medium",
                        timeStyle: "short",
                        hourCycle: "h23",
                      }).format(new Date(thread.created_at))}
                    </p>
                  </div>

                  {/* Comments Section (Within Thread) */}
                  {selectedThread === thread.id && (
                    <div className="mt-4 space-y-2">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="text-lg font-semibold">Comments</h4>
                        <button
                          onClick={() => setCommentModalOpen(true)}
                          className="bg-yellow-500 text-white px-4 py-2 rounded-md hover:bg-yellow-600"
                        >
                          Add Comment
                        </button>
                      </div>
                      {comments
                        .filter((comment) => comment.thread_id === thread.id)
                        .map((comment) => (
                          <div
                            key={comment.id}
                            className="p-2 border rounded-md bg-gray-50"
                          >
                            <p>{comment.content}</p>
                            <p className="text-sm text-gray-500">
                              Commented by {users[thread.user_id]} on{" "}
                              {new Intl.DateTimeFormat("en-GB", {
                                dateStyle: "medium",
                                timeStyle: "short",
                                hourCycle: "h23",
                              }).format(new Date(thread.created_at))}
                            </p>
                          </div>
                        ))}
                    </div>
                  )}
                </li>
              ))}
          </ul>
        </div>
      )}

      {/* Modals */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h2 className="text-lg font-bold mb-4">Add New Category</h2>
            <input
              type="text"
              placeholder="Category Name"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md mb-4"
            />
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setCategoryModalOpen(false)}
                className="px-4 py-2 bg-gray-300 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCategory}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Thread Modal */}
      {isThreadModalOpen && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h2 className="text-lg font-bold mb-4">Add New Thread</h2>
            <input
              type="text"
              placeholder="Thread Title"
              value={newThread}
              onChange={(e) => setNewThread(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md mb-4"
            />
            <textarea
              placeholder="Thread Content"
              value={newThreadContent}
              onChange={(e) => setNewThreadContent(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md mb-4"
            ></textarea>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setThreadModalOpen(false)}
                className="px-4 py-2 bg-gray-300 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleAddThread}
                className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comment Modal */}
      {isCommentModalOpen && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h2 className="text-lg font-bold mb-4">Add New Comment</h2>
            <textarea
              placeholder="Comment"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md mb-4"
            ></textarea>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setCommentModalOpen(false)}
                className="px-4 py-2 bg-gray-300 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleAddComment}
                className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Forum;
