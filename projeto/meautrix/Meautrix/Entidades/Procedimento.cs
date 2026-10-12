using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Meautrix.Entidades
{
    [Table("procedimentos")]
    public class Procedimento
    {
        [Key]
        [Column("proc_id")]
        public int ProcId { get; set; }

        [Required(ErrorMessage = "O nome da medida é obrigatório.")]
        [Column("proc_nome")]
        [StringLength(60)]
        public string ProcNome { get; set; } = string.Empty;

        [Required(ErrorMessage = "A descrição da medida é obrigatório.")]
        [Column("proc_descricao")]
        [StringLength(60)]
        public string ProcDescricao { get; set; } = string.Empty;


        /// <summary>
        /// Indicador de situação dp procimento: 'A' para Ativo, 'I' para Inativo.
        /// </summary>
        [Required]
        [Column("proc_ativo")]
        public string ProcAtivo { get; set; }
    }
}
