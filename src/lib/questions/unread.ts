export type QuestionReadState = {
  managerReply: string | null;
  participantReadAt: Date | null;
};

/** Unread when a manager reply exists and the participant has not opened it yet. */
export function hasUnreadManagerReply(question: QuestionReadState): boolean {
  if (!question.managerReply?.trim()) return false;
  return question.participantReadAt == null;
}
