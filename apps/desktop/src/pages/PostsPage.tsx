import { Button } from "@/components/atoms/Button";
import { Skeleton } from "@/components/atoms/Skeleton";
import { EmptyState } from "@/components/molecules/EmptyState";
import { PostFormModal } from "@/components/organisms/PostFormModal";
import { PostList } from "@/components/organisms/PostList";
import { usePosts } from "@/hooks/usePosts";
import { useAccountsStore } from "@/stores/accountsStore";
import type { CreatePostInput, UpdatePostInput } from "@social-pip/types";
import { FileText, Plus } from "lucide-react";
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
          <h1 className="text-2xl font-bold text-foreground">Posts</h1>
          <p className="text-muted text-sm">Manage your social media posts across all platforms</p>
        </div>
        <Button onClick={() => setShowModal(true)} disabled={selectedAccount === undefined}>
          <Plus className="h-4 w-4 mr-2" />
          New Post
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Skeleton variant="card" />
          <Skeleton variant="card" />
          <Skeleton variant="card" />
        </div>
      ) : posts.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No posts yet"
          description="Create your first post to get started"
          action={{
            label: "New Post",
            onClick: () => setShowModal(true),
          }}
        />
      ) : (
        <PostList
          posts={posts}
          loading={loading}
          onEdit={handleEdit}
          onDelete={deletePost}
          onAdd={() => setShowModal(true)}
        />
      )}

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
