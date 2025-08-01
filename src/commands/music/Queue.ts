import { Command, type Context, type Lavamusic } from "../../structures/index";

export default class Queue extends Command {
  constructor(client: Lavamusic) {
    super(client, {
      name: "queue",
      description: {
        content: "cmd.queue.description",
        examples: ["queue"],
        usage: "queue",
      },
      category: "music",
      aliases: ["q"],
      cooldown: 3,
      args: false,
      vote: false,
      player: {
        voice: true,
        dj: false,
        active: true,
        djPerm: null,
      },
      permissions: {
        dev: false,
        client: [
          "SendMessages",
          "ReadMessageHistory",
          "ViewChannel",
          "EmbedLinks",
        ],
        user: [],
      },
      slashCommand: true,
      options: [],
    });
  }

  public async run(client: Lavamusic, ctx: Context): Promise<any> {
    const player = client.manager.getPlayer(ctx.guild!.id);
    if (!player)
      return await ctx.sendMessage(
        ctx.locale("event.message.no_music_playing"),
      );
    const embed = this.client.embed();
    if (player.queue.current && player.queue.tracks.length === 0) {
      return await ctx.sendMessage({
        embeds: [
          embed.setColor(this.client.color.main).setDescription(
            ctx.locale("cmd.queue.now_playing", {
              title: player.queue.current.info.title,
              uri: player.queue.current.info.uri,
              requester: (player.queue.current.requester as any).id,
              duration: player.queue.current.info.isStream
                ? ctx.locale("cmd.queue.live")
                : client.utils.formatTime(player.queue.current.info.duration),
            }),
          ),
        ],
      });
    }
    const songStrings: string[] = [];
    for (let i = 0; i < player.queue.tracks.length; i++) {
      const track = player.queue.tracks[i];
      songStrings.push(
        ctx.locale("cmd.queue.track_info", {
          index: i + 1,
          title: track.info.title,
          uri: track.info.uri,
          requester: (track.requester as any).id,
          duration: track.info.isStream
            ? ctx.locale("cmd.queue.live")
            : client.utils.formatTime(track.info.duration!),
        }),
      );
    }
    let chunks = client.utils.chunk(songStrings, 10);

    if (chunks.length === 0) chunks = [songStrings];

    const pages = chunks.map((chunk, index) => {
      return this.client
        .embed()
        .setColor(this.client.color.main)
        .setAuthor({
          name: ctx.locale("cmd.queue.title"),
          iconURL: ctx.guild.icon
            ? ctx.guild.iconURL()!
            : ctx.author?.displayAvatarURL(),
        })
        .setDescription(
          chunk.join("\n") +
            "\n\n" +
            ctx.locale("cmd.queue.duration", {
              totalDuration: client.utils.formatTime(
                player.queue.utils.totalDuration() -
                  player.queue.current?.info.duration!,
              ),
            }),
        )
        .setFooter({
          text: ctx.locale("cmd.queue.page_info", {
            index: index + 1,
            total: chunks.length,
          }),
        });
    });
    return await client.utils.paginate(client, ctx, pages);
  }
}

/**
 * Project: lavamusic
 * Author: Appu
 * Main Contributor: LucasB25
 * Company: Coders
 * Copyright (c) 2024. All rights reserved.
 * This code is the property of Coder and may not be reproduced or
 * modified without permission. For more information, contact us at
 * https://discord.gg/YQsGbTwPBx
 */
