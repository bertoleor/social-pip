import { Button } from "@/components/atoms/Button";
import { PostFormModal } from "@/components/organisms/PostFormModal";
import { PostList } from "@/components/organisms/PostList";
import { usePosts } from "@/hooks/usePosts";
import { useAccountsStore } from "@/stores/accountsStore";
import type { CreatePostInput, UpdatePostInput } from "@social-pip/types";
import { Plus } from "lucide-react";
import { useState } from "react";

export default function PostsPage(): React.ReactElement {
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { posts, loading, createPost, updatePost, deletePost } = usePosts();

  const { accounts } = useAccountsStore();
  const selectedAccount = accounts.length > 0 ? accounts[0] : undefined;

  const handleCreate = async (data: CreatePostInput | UpdatePostInput) => {
    if ("accountId" in data) {
      await createPost(data as CreatePostInput);
    } else {
      if (editingId !== null) {
        await updatePost(editingId, data as UpdatePostInput);
      }
    }
  };

  const handleEdit = (id: string) => {
    setEditingId(id);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
  };

  const editingPost = editingId !== null ? posts.find((p) => p.id === editingId) : undefined;

  return (
    <div data-testid="page-posts" className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Posts</h1>
          <p className="text-gray-500 text-sm">
            Manage your social media posts across all platforms
          </p>
        </div>
        <Button onClick={() => setShowModal(true)} disabled={selectedAccount === undefined}>
          <Plus className="h-4 w-4 mr-2" />
          New Post
        </Button>
      </div>

      <PostList
        posts={posts}
        loading={loading}
        onEdit={handleEdit}
        onDelete={deletePost}
        onAdd={() => setShowModal(true)}
      />

      {showModal && selectedAccount !== undefined && (
        <PostFormModal
          post={editingPost}
          accountId={selectedAccount.id}
          onSubmit={handleCreate}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}
