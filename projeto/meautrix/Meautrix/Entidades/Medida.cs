using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Meautrix.Entidades
{
    [Table("MEDIDAS")]
    public class Medida
    {
        [Key]
        [Column("MED_ID")]
        public int MedId { get; set; }

        [Required(ErrorMessage = "A descrição da medida é obrigatório.")]
        [Column("MED_DESCRICAO")]
        [StringLength(30)]
        public string MedDescricao { get; set; } = string.Empty;

        [Required(ErrorMessage = "A sigla da medida é obrigatório.")]
        [Column("MED_SIGLA")]
        [StringLength(10)] 
        public string MedSigla { get; set; } = string.Empty;


        /// <summary>
        /// Indicador de situação da medida: 'A' para Ativo, 'I' para Inativo.
        /// </summary>
        [Required]
        [Column("MED_ATIVO")]
        public string MedAtivo { get; set; }
    }
}
