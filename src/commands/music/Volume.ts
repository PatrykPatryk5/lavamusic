import { Command, type Context, type Lavamusic } from "../../structures/index";

export default class Volume extends Command {
  constructor(client: Lavamusic) {
    super(client, {
      name: "volume",
      description: {
        content: "cmd.volume.description",
        examples: ["volume 100"],
        usage: "volume <number>",
      },
      category: "music",
      aliases: ["v", "vol"],
      cooldown: 3,
      args: true,
      vote: true,
      player: {
        voice: true,
        dj: true,
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
      options: [
        {
          name: "number",
          description: "cmd.volume.options.number",
          type: 4,
          required: true,
        },
      ],
    });
  }

  public async run(
    client: Lavamusic,
    ctx: Context,
    args: string[],
  ): Promise<any> {
    const player = client.manager.getPlayer(ctx.guild!.id);
    const embed = this.client.embed();
    const number = Number(args[0]);
    if (!player)
      return await ctx.sendMessage(
        ctx.locale("event.message.no_music_playing"),
      );
    if (Number.isNaN(number) || number < 0 || number > 200) {
      let description = "";
      if (Number.isNaN(number))
        description = ctx.locale("cmd.volume.messages.invalid_number");
      else if (number < 0)
        description = ctx.locale("cmd.volume.messages.too_low");
      else if (number > 200)
        description = ctx.locale("cmd.volume.messages.too_high");

      return await ctx.sendMessage({
        embeds: [
          embed.setColor(this.client.color.red).setDescription(description),
        ],
      });
    }

    await player.setVolume(number);
    const currentVolume = player.volume;

    return await ctx.sendMessage({
      embeds: [
        embed.setColor(this.client.color.main).setDescription(
          ctx.locale("cmd.volume.messages.set", {
            volume: currentVolume,
          }),
        ),
      ],
    });
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
