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
  type ModalState = {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: (() => void) | null;
  };

  const [modalState, setModalState] = useState<ModalState>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: null,
  });

  const [users, setUsers] = useState<Record<number, string>>({});

  const deleteThread = async (threadId: number) => {
    try {
      const response = await apiRequest(
        "delete_thread",
        "DELETE",
        `${threadId}`
      );
      if (response.success) {
        setThreads(threads.filter((thread) => thread.id !== threadId));
        setModalState({ ...modalState, isOpen: false });
      } else {
        console.error("Failed to delete thread:", response.message);
      }
    } catch (error) {
      console.error("Error deleting thread:", error);
    }
  };

  const deleteComment = async (commentId: number) => {
    try {
      const response = await apiRequest(
        "delete_comment",
        "DELETE",
        `${commentId}`
      );
      if (response.success) {
        setComments(comments.filter((comment) => comment.id !== commentId));
        setModalState({ ...modalState, isOpen: false });
      } else {
        console.error("Failed to delete comment:", response.message);
      }
    } catch (error) {
      console.error("Error deleting comment:", error);
    }
  };

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
      //   console.log(response.data);
      setCategories(response.data);
      if (response.data.length > 0 && selectedCategory === null) {
        setSelectedCategory(response.data[0].id);
      }
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
    <div className="p-6 bg-gray-10 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-center">Forum</h1>

      {/* Categories as Navigation Bar */}
      <div className="flex items-center justify-between border-b pb-4 mb-6">
        <div className="flex space-x-4 overflow-x-auto">
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
        </div>
        <button
          onClick={() => setCategoryModalOpen(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
        >
          Add Category
        </button>
      </div>

      {/* Threads Section */}
      {selectedCategory && (
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-bold">Threads</h2>
              <p>Click on the thread to join the discussion! 👇👇 </p>
            </div>
            <button
              onClick={() => setThreadModalOpen(true)}
              className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
            >
              Add Thread
            </button>
          </div>
          {threads.filter((thread) => thread.category_id === selectedCategory)
            .length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              Add a thread for this topic!
            </div>
          ) : (
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
                    {/* Delete Thread Button */}
                    {thread.user_id === user?.id && (
                      <button
                        onClick={() =>
                          setModalState({
                            isOpen: true,
                            title: "Delete Thread",
                            message:
                              "Are you sure you want to delete this thread?",
                            onConfirm: () => deleteThread(thread.id),
                          })
                        }
                        className="text-red-500 text-sm mt-2"
                      >
                        Delete Thread
                      </button>
                    )}

                    {/* Comments Section (Within Thread) */}
                    {selectedThread === thread.id && (
                      <div className="mt-4 space-y-2">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="text-lg font-semibold text-blue-800">
                            Discussion
                          </h4>
                          <button
                            onClick={() => setCommentModalOpen(true)}
                            className="bg-yellow-500 text-white px-4 py-2 rounded-md hover:bg-yellow-600"
                          >
                            Add Comment
                          </button>
                        </div>
                        {comments.filter(
                          (comment) => comment.thread_id === thread.id
                        ).length === 0 ? (
                          <p className="text-sm text-gray-500">
                            No comments yet. Be the first to comment!
                          </p>
                        ) : (
                          comments
                            .filter(
                              (comment) => comment.thread_id === thread.id
                            )
                            .map((comment) => (
                              <div
                                key={comment.id}
                                className="p-2 border rounded-md bg-gray-50"
                              >
                                <p>{comment.content}</p>
                                <p className="text-sm text-gray-500">
                                  Commented by {users[comment.user_id]} on{" "}
                                  {new Intl.DateTimeFormat("en-GB", {
                                    dateStyle: "medium",
                                    timeStyle: "short",
                                    hourCycle: "h23",
                                  }).format(new Date(comment.created_at))}
                                </p>
                                {/* Delete Comment Button */}
                                {comment.user_id === user?.id && (
                                  <button
                                    onClick={() =>
                                      setModalState({
                                        isOpen: true,
                                        title: "Delete Comment",
                                        message:
                                          "Are you sure you want to delete this comment?",
                                        onConfirm: () =>
                                          deleteComment(comment.id),
                                      })
                                    }
                                    className="text-red-500 text-sm mt-2"
                                  >
                                    Delete Comment
                                  </button>
                                )}
                              </div>
                            ))
                        )}
                      </div>
                    )}
                  </li>
                ))}
            </ul>
          )}
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
      {modalState.isOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-md shadow-md">
            <h3 className="text-lg font-bold">{modalState.title}</h3>
            <p className="mt-2">{modalState.message}</p>
            <div className="flex justify-end mt-4 space-x-2">
              <button
                onClick={() => setModalState({ ...modalState, isOpen: false })}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={modalState.onConfirm || (() => {})} // Provide a fallback no-op function
                className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Forum;
