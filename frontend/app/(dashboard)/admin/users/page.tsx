"use client";

import React, { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import {
  useUsers,
  useCreateUser,
  useDeleteUser,
  useApproveOrganizer,
  type CreateUserInput,
} from "@/lib/query/users.query";
import { usePusherChannel } from "@/hooks/use-pusher";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Users,
  UserPlus,
  Trash2,
  Loader2,
  Search,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Shield,
  GraduationCap,
  Briefcase,
  X,
  Check,
  AlertCircle,
  Phone,
  Clock,
  CheckCircle2,
} from "lucide-react";

type RoleFilter = "ALL" | "student" | "organizer" | "admin" | "PENDING";

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [selectedRole, setSelectedRole] = useState<RoleFilter>("ALL");
  const [page, setPage] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Create User Form State
  const [formData, setFormData] = useState<CreateUserInput>({
    name: "",
    email: "",
    password: "",
    role: "student",
    phoneNumber: "",
    studentId: "",
    department: "",
  });
  const [formError, setFormError] = useState<string | null>(null);

  const roleParam =
    selectedRole === "PENDING"
      ? "organizer"
      : selectedRole === "ALL"
        ? undefined
        : selectedRole;
  const isApprovedParam = selectedRole === "PENDING" ? false : undefined;

  const { data, isLoading } = useUsers({
    page,
    limit: 10,
    search: search || undefined,
    role: roleParam,
    isApproved: isApprovedParam,
  });

  const createMutation = useCreateUser();
  const deleteMutation = useDeleteUser();
  const approveMutation = useApproveOrganizer();

  // Real-time synchronization for users
  usePusherChannel("users", {
    "user:created": () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-analytics"] });
    },
    "user:deleted": () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-analytics"] });
    },
    "user:updated": () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-analytics"] });
    },
  });

  const usersList = data?.data ?? [];
  const pagination = data?.pagination;

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.name.trim() || !formData.email.trim() || !formData.password.trim()) {
      setFormError("Name, email, and password are required.");
      return;
    }

    if (formData.password.length < 6) {
      setFormError("Password must be at least 6 characters.");
      return;
    }

    if (formData.role === "organizer" && (!formData.phoneNumber || formData.phoneNumber.trim().length < 8)) {
      setFormError("Phone number is required for organizers (minimum 8 digits).");
      return;
    }

    try {
      await createMutation.mutateAsync(formData);
      setIsCreateModalOpen(false);
      setFormData({
        name: "",
        email: "",
        password: "",
        role: "student",
        phoneNumber: "",
        studentId: "",
        department: "",
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create user";
      setFormError(msg);
    }
  };

  const handleApproveUser = async (userId: string, userName: string) => {
    try {
      await approveMutation.mutateAsync(userId);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to verify organizer";
      alert(msg);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (userId === currentUser?.id) {
      alert("You cannot delete your own administrative account.");
      return;
    }

    if (confirm(`Are you sure you want to permanently delete user account "${userName}"? This action cannot be undone.`)) {
      try {
        await deleteMutation.mutateAsync(userId);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to delete user";
        alert(msg);
      }
    }
  };

  const roleTabs: { label: string; value: RoleFilter }[] = [
    { label: "All Users", value: "ALL" },
    { label: "Students", value: "student" },
    { label: "Organizers", value: "organizer" },
    { label: "Pending Verification", value: "PENDING" },
    { label: "Admins", value: "admin" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-border pb-5 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-destructive uppercase tracking-wider">
            <Sparkles className="h-3.5 w-3.5" />
            Account Administration
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">
            User Management Directory
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            View, provision, and manage student, organizer, and administrator accounts across Univent.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => {
              setFormError(null);
              setIsCreateModalOpen(true);
            }}
            className="gap-2 text-xs font-semibold"
          >
            <UserPlus className="h-4 w-4" />
            Create User
          </Button>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Role Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-border bg-muted/40 p-1">
          {roleTabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => {
                setSelectedRole(tab.value);
                setPage(1);
              }}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                selectedRole === tab.value
                  ? "bg-card text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name, email, ID..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-lg border border-border bg-background py-1.5 pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-hidden"
          />
        </div>
      </div>

      {/* Users Table */}
      {isLoading ? (
        <div className="flex min-h-[320px] flex-col items-center justify-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-destructive" />
          <p className="text-sm text-muted-foreground">Loading university directory...</p>
        </div>
      ) : usersList.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <Users className="mx-auto h-10 w-10 text-muted-foreground" />
          <h3 className="mt-4 text-base font-semibold text-foreground">No users found</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {search || selectedRole !== "ALL"
              ? "No user accounts match your search filter."
              : "No accounts found in directory."}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-muted/40 text-xs font-semibold text-muted-foreground uppercase">
                <tr>
                  <th className="px-5 py-3.5">User</th>
                  <th className="px-5 py-3.5">Role</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Phone Number</th>
                  <th className="px-5 py-3.5">Department / Student ID</th>
                  <th className="px-5 py-3.5">Registered</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {usersList.map((u) => {
                  const createdAtDate = new Date(u.createdAt);
                  const formattedDate = createdAtDate.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  });

                  return (
                    <tr key={u.id} className="transition hover:bg-muted/20">
                      {/* Name & Email */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted font-bold text-foreground text-xs uppercase">
                            {u.name ? u.name.slice(0, 2) : "U"}
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">
                              {u.name}
                              {u.id === currentUser?.id && (
                                <span className="ml-2 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                                  You
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-muted-foreground">{u.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold ${
                            u.role === "admin"
                              ? "bg-destructive/10 text-destructive"
                              : u.role === "organizer"
                                ? "bg-purple-500/10 text-purple-600"
                                : "bg-blue-500/10 text-blue-600"
                          }`}
                        >
                          {u.role === "admin" && <Shield className="h-3 w-3" />}
                          {u.role === "organizer" && <Briefcase className="h-3 w-3" />}
                          {u.role === "student" && <GraduationCap className="h-3 w-3" />}
                          <span className="capitalize">{u.role}</span>
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        {u.role === "organizer" ? (
                          u.isApproved === false ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
                              <Clock className="h-3 w-3 animate-pulse" />
                              Pending Approval
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                              <CheckCircle2 className="h-3 w-3" />
                              Verified
                            </span>
                          )
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                            Active
                          </span>
                        )}
                      </td>

                      {/* Phone Number */}
                      <td className="px-5 py-4 text-xs">
                        {u.phoneNumber ? (
                          <span className="inline-flex items-center gap-1.5 font-mono text-foreground">
                            <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                            {u.phoneNumber}
                          </span>
                        ) : (
                          <span className="text-muted-foreground italic">Not provided</span>
                        )}
                      </td>

                      {/* Details */}
                      <td className="px-5 py-4 text-xs text-muted-foreground">
                        {u.role === "student" ? (
                          u.studentId ? (
                            <span className="font-mono text-foreground">{u.studentId}</span>
                          ) : (
                            <span className="italic">Not provided</span>
                          )
                        ) : (
                          u.department || <span className="italic">General</span>
                        )}
                      </td>

                      {/* Registered Date */}
                      <td className="px-5 py-4 text-xs text-muted-foreground">
                        {formattedDate}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {u.role === "organizer" && u.isApproved === false && (
                            <Button
                              size="xs"
                              variant="outline"
                              disabled={approveMutation.isPending}
                              onClick={() => handleApproveUser(u.id, u.name)}
                              className="gap-1 border-emerald-500/40 text-emerald-600 hover:bg-emerald-500/10 dark:text-emerald-400 font-semibold shadow-xs"
                              title={`Verify and activate ${u.name}`}
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Verify Organizer
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={u.id === currentUser?.id || deleteMutation.isPending}
                            onClick={() => handleDeleteUser(u.id, u.name)}
                            className="h-8 w-8 p-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                            title={
                              u.id === currentUser?.id
                                ? "Cannot delete own account"
                                : `Delete ${u.name}`
                            }
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border px-5 py-3 text-xs text-muted-foreground">
              <span>
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} total accounts)
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="h-8 gap-1 text-xs"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="h-8 gap-1 text-xs"
                >
                  Next
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create User Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <h2 className="text-lg font-bold text-foreground">Create User Account</h2>
                <p className="text-xs text-muted-foreground">
                  Provision a new student, organizer, or admin profile.
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setIsCreateModalOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {formError && (
              <div className="mt-4 flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="mt-4 space-y-4">
              {/* Role Selection */}
              <div>
                <label className="block text-xs font-semibold text-foreground uppercase tracking-wide">
                  Role
                </label>
                <div className="mt-1 grid grid-cols-3 gap-2 rounded-lg border border-border bg-muted/40 p-1">
                  {(["student", "organizer", "admin"] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setFormData({ ...formData, role: r })}
                      className={`rounded-md py-1.5 text-xs font-medium capitalize transition ${
                        formData.role === r
                          ? "bg-card text-foreground shadow-xs font-semibold"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-foreground uppercase tracking-wide">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-hidden"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-foreground uppercase tracking-wide">
                  University Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. jdoe@university.edu"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-hidden"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-foreground uppercase tracking-wide">
                  Temporary Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-hidden"
                />
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-xs font-semibold text-foreground uppercase tracking-wide">
                  Phone Number {formData.role === "organizer" ? <span className="text-destructive">*</span> : <span className="text-muted-foreground font-normal">(Optional)</span>}
                </label>
                <input
                  type="tel"
                  required={formData.role === "organizer"}
                  placeholder="+1 (555) 000-0000"
                  value={formData.phoneNumber || ""}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-hidden"
                />
              </div>

              {/* Conditional Field: Student ID vs Department */}
              {formData.role === "student" ? (
                <div>
                  <label className="block text-xs font-semibold text-foreground uppercase tracking-wide">
                    Student ID (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. UGR/1234/15"
                    value={formData.studentId || ""}
                    onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                    className="mt-1 block w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-hidden"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-foreground uppercase tracking-wide">
                    Department or Club Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Computer Science / Robotics Club"
                    value={formData.department || ""}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="mt-1 block w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-hidden"
                  />
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={createMutation.isPending}
                  className="gap-1.5"
                >
                  {createMutation.isPending ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      Confirm & Create
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
